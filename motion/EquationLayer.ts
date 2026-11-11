import { Node, Path, Line } from '@motion-canvas/2d';
import { all, Color, easeInOutCubic, tween } from '@motion-canvas/core';
import type { ThreadGenerator } from '@motion-canvas/core';
import type { Pose } from './geometry';
import { arcPoint, bounds, center, GOLD, contextPairs } from './geometry';

/** Each mathematical glyph has its own persistent position and outline. */
export class EquationLayer {
  readonly root = new Node({});
  readonly underline = new Line({
    points: [
      [0, 0],
      [1, 0],
    ],
    stroke: GOLD,
    lineWidth: 2,
    end: 0,
  });
  private nodes: Path[] = [];
  poses: Pose[] = [];
  constructor(private readonly outlines: Record<string, string>) {
    this.root.add(this.underline);
  }
  private create(p: Pose) {
    const node = new Path({
      data: this.outlines[p.path],
      position: [p.x, p.y],
      scale: [p.sx, p.sy],
      fill: p.color,
    });
    this.root.add(node);
    return node;
  }
  show(poses: Pose[]) {
    this.nodes.forEach((n) => n.remove());
    this.poses = poses;
    this.nodes = poses.map((p) => this.create(p));
    this.underline.end(0);
  }
  remove() {
    this.root.remove();
  }
  *tint(tag: string, color: string, duration: number): ThreadGenerator {
    yield* all(
      ...this.nodes.flatMap((node, i) =>
        this.poses[i].tags.includes(tag) ? [node.fill(color, duration)] : [],
      ),
    );
    this.poses = this.poses.map((p) => (p.tags.includes(tag) ? { ...p, color } : p));
  }
  *emphasize(duration = 0.5, tag = 'focus', color = GOLD): ThreadGenerator {
    const selected = this.poses.filter((g) => g.tags.includes(tag));
    if (!selected.length) return;
    const b = bounds(selected);
    this.underline.points([
      [b[0] - 2, b[3] + 7],
      [b[2] + 2, b[3] + 7],
    ]);
    this.underline.stroke(color);
    this.underline.end(0);
    yield* this.underline.end(1, duration);
  }
  *to(target: Pose[], duration: number, lift = 22, collapseAt?: [number, number]): ThreadGenerator {
    const source = this.poses,
      pairs = contextPairs(source, target);
    const usedFrom = new Set(pairs.map((p) => p[0])),
      usedTo = new Set(pairs.map((p) => p[1]));
    const removed = source.map((_, i) => i).filter((i) => !usedFrom.has(i));
    const inserted = target.map((_, i) => i).filter((i) => !usedTo.has(i));
    const origin = center(removed.length ? removed.map((i) => source[i]) : source);
    const destination =
      collapseAt ||
      center(inserted.map((i) => target[i]).length ? inserted.map((i) => target[i]) : target);
    const tracks: { node: Path; from: Pose; to: Pose; arc: number }[] = [];
    const morphs: ThreadGenerator[] = [];
    const nextNodes: Path[] = new Array(target.length);
    const retired: Path[] = [];
    this.underline.end(0);
    for (const [i, j] of pairs) {
      nextNodes[j] = this.nodes[i];
      tracks.push({
        node: this.nodes[i],
        from: source[i],
        to: target[j],
        arc:
          Math.abs(source[i].x - target[j].x) > 18 || Math.abs(source[i].y - target[j].y) > 8
            ? lift
            : 0,
      });
    }
    // Restore continuous local transformations. Prefix/suffix context stays
    // attached to its own occurrence; only the highlighted calculation morphs.
    // Explicit factor/exponent layers still supply their authored identities.
    for (let k = 0; k < Math.max(removed.length, inserted.length); k++) {
      const i = removed[k],
        j = inserted[k];
      if (i !== undefined && j !== undefined) {
        const node = this.nodes[i];
        nextNodes[j] = node;
        tracks.push({ node, from: source[i], to: target[j], arc: lift });
        morphs.push(node.data(this.outlines[target[j].path], duration, easeInOutCubic));
      } else if (i !== undefined) {
        const p = source[i];
        retired.push(this.nodes[i]);
        tracks.push({
          node: this.nodes[i],
          from: p,
          to: { ...p, x: destination[0], y: destination[1], sx: p.sx * 0.001, sy: p.sy * 0.001 },
          arc: lift,
        });
      } else if (j !== undefined) {
        const p = target[j];
        const start = { ...p, x: origin[0], y: origin[1], sx: p.sx * 0.001, sy: p.sy * 0.001 };
        const node = this.create(start);
        nextNodes[j] = node;
        tracks.push({ node, from: start, to: p, arc: lift });
      }
    }
    yield* all(
      tween(duration, (value) => {
        const t = easeInOutCubic(value);
        for (const { node, from, to, arc } of tracks) {
          node.position(arcPoint([from.x, from.y], [to.x, to.y], t, arc));
          node.scale([from.sx + (to.sx - from.sx) * t, from.sy + (to.sy - from.sy) * t]);
          node.fill(Color.lerp(from.color, to.color, t));
        }
      }),
      ...morphs,
    );
    retired.forEach((node) => node.remove());
    this.nodes = nextNodes;
    this.poses = target;
  }

  /** Highlight, then continuously transform the selected calculation in place. */
  *rewrite(target: Pose[], duration = 1.65): ThreadGenerator {
    const pairs = contextPairs(this.poses, target);
    const retained = new Set(pairs.map(([i]) => i));
    this.poses = this.poses.map((p, i) => ({
      ...p,
      tags: retained.has(i) ? p.tags : [...p.tags, 'replacement'],
    }));
    yield* all(
      this.tint('replacement', GOLD, duration * 0.2),
      this.emphasize(duration * 0.2, 'replacement'),
    );
    yield* this.to(target, duration * 0.8, 12);
  }

  /** A different mathematical statement enters as a whole, never as a false
   * algebraic transformation. Repeated expressions only change their highlight. */
  *introduce(target: Pose[], duration = 0.85): ThreadGenerator {
    if (
      this.poses.length === target.length &&
      this.poses.every((p, i) => p.path === target[i].path)
    ) {
      yield* this.to(target, 0.4, 0);
      return;
    }
    const incoming = new EquationLayer(this.outlines);
    incoming.show(target);
    this.root.parent()!.add(incoming.root);
    incoming.root.y(400);
    yield* all(
      this.root.y(-400, duration, easeInOutCubic),
      incoming.root.y(0, duration, easeInOutCubic),
    );
    this.show(target);
    this.root.y(0);
    incoming.remove();
  }
}
