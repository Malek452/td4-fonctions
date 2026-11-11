import type { Step } from '../types';
import { theme } from '../theme';
import { MathView } from './Math';
import { TD4Diagram, isTD4Graph, td4GraphDescriptions } from './TD4Graphs';

export const graphDescriptions = {
  ...td4GraphDescriptions,
  log: 'La fonction logarithme népérien est définie et strictement croissante sur ]0 ; +∞[. Sa courbe représentative passe par les points (1 ; 0) et (e ; 1). Les pointillés repèrent leurs coordonnées ; le dessin ne constitue pas une démonstration de la stricte croissance.',
  exp: 'La fonction exponentielle est définie, strictement positive et strictement croissante sur ℝ. Sa courbe représentative se situe au-dessus de l’axe des abscisses et passe par les points (0 ; 1) et (1 ; e).',
  'cosine-equation':
    'La droite verticale d’abscisse 1/2 coupe le cercle trigonométrique en deux points symétriques par rapport à l’axe des abscisses. Ils sont associés à π/3 et −π/3, à un nombre entier de tours près.',
  'sine-cosine-equation':
    'La droite d’équation ordonnée = abscisse coupe le cercle trigonométrique en deux points diamétralement opposés, associés à π/4 et 5π/4. Un demi-tour conserve l’égalité entre le cosinus et le sinus.',
  'cosine-abscissas':
    'Le cosinus prend ses valeurs dans [−1 ; 1]. Les abscisses strictement inférieures à √3/2 forment le segment bleu, de −1 inclus à √3/2 exclu. Le cercle vide marque le seuil exclu.',
  'cosine-inequality':
    'Sur le cercle trigonométrique, cos(x) est l’abscisse du point associé au réel x. Le segment bleu indique −1 ≤ cos(x) < √3/2. Pour x dans [0 ; 2π], l’arc bleu correspondant donne π/6 < x < 11π/6. Les extrémités de l’arc sont exclues et représentées par des cercles vides.',
};

const ink = theme.mathInk,
  blue = theme.second,
  rust = theme.active;
const pts = (
  fn: (x: number) => number,
  a: number,
  b: number,
  X: (x: number) => number,
  Y: (y: number) => number,
) =>
  Array.from({ length: 181 }, (_, i) => {
    const x = a + ((b - a) * i) / 180;
    return `${i ? 'L' : 'M'}${X(x).toFixed(2)},${Y(fn(x)).toFixed(2)}`;
  }).join(' ');

function ReferenceCurve({ kind }: { kind: 'log' | 'exp' }) {
  const log = kind === 'log';
  const X = (x: number) => (log ? 115 + x * 86 : 345 + x * 107);
  const Y = (y: number) => (log ? 210 - y * 58 : 330 - y * 43);
  const axisY = Y(0),
    axisX = X(0);
  const path = log ? pts(Math.log, 0.075, 6.3, X, Y) : pts(Math.exp, -2.9, 1.98, X, Y);
  const pX = log ? Math.E : 1,
    pY = log ? 1 : Math.E;
  return (
    <svg viewBox="0 0 760 400" role="img" aria-label={graphDescriptions[kind]}>
      <title>
        {log
          ? 'Courbe représentative de la fonction logarithme népérien'
          : 'Courbe représentative de la fonction exponentielle'}
      </title>
      <g stroke={ink} strokeWidth="2.5" fill="none">
        <path d={`M45,${axisY} H715 m-10,-6 10,6 -10,6`} />
        <path d={`M${axisX},370 V25 m-6,10 6,-10 6,10`} />
      </g>
      <g stroke={theme.muted} strokeWidth="2" strokeDasharray="7 7" fill="none">
        <path d={`M${X(pX)},${axisY} V${Y(pY)} H${axisX}`} />
      </g>
      <path d={path} stroke={blue} strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <g fill={ink} fontSize="25">
        <text x="725" y={axisY + 8}>
          x
        </text>
        <text x={axisX + 15} y="31">
          y
        </text>
        <text x={axisX - 27} y={axisY + 28}>
          0
        </text>
        {log ? (
          <>
            <text x={X(1) - 6} y={axisY + 30}>
              1
            </text>
            <text x={X(Math.E) - 6} y={axisY + 30}>
              e
            </text>
            <text x={axisX - 27} y={Y(1) + 7}>
              1
            </text>
            <text x={X(5.2)} y={Y(Math.log(5.2)) - 20} fill={blue}>
              ln(x)
            </text>
          </>
        ) : (
          <>
            <text x={X(1) - 6} y={axisY + 30}>
              1
            </text>
            <text x={axisX - 27} y={Y(1) + 7}>
              1
            </text>
            <text x={axisX - 27} y={Y(Math.E) + 7}>
              e
            </text>
            <text x={X(1.98) + 18} y={Y(Math.exp(1.98)) + 8} fill={blue}>
              exp(x)
            </text>
          </>
        )}
      </g>
      <g fill={rust} stroke={theme.board} strokeWidth="2">
        <circle cx={X(log ? 1 : 0)} cy={Y(log ? 0 : 1)} r="6.5" />
        <circle cx={X(pX)} cy={Y(pY)} r="6.5" />
      </g>
    </svg>
  );
}

function TrigEquation({ kind }: { kind: 'cosine-equation' | 'sine-cosine-equation' }) {
  const cosine = kind === 'cosine-equation';
  const cx = 255,
    cy = 200,
    r = 140;
  const angles = cosine ? [Math.PI / 3, -Math.PI / 3] : [Math.PI / 4, (5 * Math.PI) / 4];
  const labels = cosine ? ['π/3', '−π/3'] : ['π/4', '5π/4'];
  return (
    <svg viewBox="0 0 760 400" role="img" aria-label={graphDescriptions[kind]}>
      <title>
        {cosine ? 'Deux points d’abscisse 1/2' : 'Deux points dont l’abscisse égale l’ordonnée'}
      </title>
      <g stroke={ink} strokeWidth="2" fill="none">
        <path d="M70,200 H440 m-10,-6 10,6 -10,6" />
        <path d="M255,380 V20 m-6,10 6,-10 6,10" />
        <circle cx={cx} cy={cy} r={r} stroke={theme.muted} strokeWidth="3" />
      </g>
      <path
        d={cosine ? `M${cx + r / 2},40 V360` : 'M90,365 L420,35'}
        stroke={rust}
        strokeWidth="3"
        strokeDasharray="8 6"
        fill="none"
      />
      {cosine && <path d={`M${cx},${cy} H${cx + r / 2}`} stroke={blue} strokeWidth="6" />}
      <g fill={ink} fontSize="25">
        <text x="229" y="228">
          O
        </text>
        <text x="410" y="230">
          1
        </text>
        <text x="76" y="230">
          −1
        </text>
        <text x="269" y="61">
          1
        </text>
        <text x="269" y="356">
          −1
        </text>
        {cosine && (
          <text x={cx + r / 2 + 10} y="230" fill={rust}>
            1/2
          </text>
        )}
        <text x="475" y="151" fill={rust} fontSize="24">
          {cosine ? 'Abscisse = 1/2' : 'Ordonnée = abscisse'}
        </text>
        <text x="475" y="203" fill={blue}>
          {cosine ? 'Deux points' : 'Deux points opposés'}
        </text>
        <text x="475" y="241" fill={blue}>
          {cosine ? 'symétriques' : 'sur le cercle'}
        </text>
        <text x="475" y="299" fontSize="24">
          {cosine ? 'x = ±π/3 + 2kπ' : 'x = π/4 + kπ'}
        </text>
        <text x="475" y="335" fontSize="24">
          k ∈ ℤ
        </text>
      </g>
      {angles.map((angle, i) => {
        const x = cx + r * Math.cos(angle),
          y = cy - r * Math.sin(angle);
        return (
          <g key={labels[i]}>
            <circle
              className="solution-point"
              cx={x}
              cy={y}
              r="7"
              fill={blue}
              stroke={theme.board}
              strokeWidth="2"
            />
            <text
              x={x + (cosine || i === 0 ? 16 : -42)}
              y={y + (i === 0 ? -13 : 34)}
              fill={blue}
              fontSize="26"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CosineInequality({ showArc = true }: { showArc?: boolean }) {
  const cx = 255,
    cy = 200,
    r = 140,
    cut = cx + (r * Math.sqrt(3)) / 2;
  const upper = cy - r / 2,
    lower = cy + r / 2;
  return (
    <svg
      viewBox="0 0 760 400"
      role="img"
      aria-label={graphDescriptions[showArc ? 'cosine-inequality' : 'cosine-abscissas']}
    >
      <title>Cosinus strictement inférieur à la racine carrée de trois divisée par deux</title>
      <g stroke={ink} strokeWidth="2" fill="none">
        <path d="M70,200 H440 m-10,-6 10,6 -10,6" />
        <path d="M255,380 V20 m-6,10 6,-10 6,10" />
        <circle cx={cx} cy={cy} r={r} stroke={theme.muted} strokeWidth="3" />
      </g>
      {showArc && (
        <path
          d={`M${cut},${upper} A${r},${r} 0 1 0 ${cut},${lower}`}
          fill="none"
          stroke={blue}
          strokeWidth="10"
        />
      )}
      <path d={`M${cx - r},${cy} H${cut}`} fill="none" stroke={blue} strokeWidth="6" />
      <circle cx={cx - r} cy={cy} r="6" fill={blue} />
      <path d={`M${cut},45 V355`} stroke={rust} strokeWidth="3" strokeDasharray="8 6" />
      <g fill={theme.board} stroke={blue} strokeWidth="4">
        <circle cx={cut} cy={cy} r="7" />
        {showArc && (
          <>
            <circle cx={cut} cy={upper} r="7" />
            <circle cx={cut} cy={lower} r="7" />
          </>
        )}
      </g>
      <g fill={ink} fontSize="25">
        <text x="229" y="228">
          O
        </text>
        <text x="410" y="230">
          1
        </text>
        <text x="76" y="230">
          −1
        </text>
        <text x="269" y="61">
          1
        </text>
        <text x="269" y="356">
          −1
        </text>
        <text x={cut + 18} y={upper - 8}>
          π/6
        </text>
        <text x={cut + 18} y={lower + 28}>
          11π/6
        </text>
        <text x="490" y="151" fill={rust}>
          Seuil : √3/2
        </text>
        <text x="490" y="203" fill={blue}>
          Abscisses retenues
        </text>
        {showArc ? (
          <>
            <text x="490" y="245" fill={blue}>
              Arc des solutions
            </text>
            <text x="490" y="287">
              Extrémités exclues
            </text>
          </>
        ) : (
          <>
            <text x="490" y="255">
              −1 inclus
            </text>
            <text x="490" y="293">
              √3/2 exclu
            </text>
          </>
        )}
      </g>
      <path d="M457,195 H481" stroke={blue} strokeWidth="6" fill="none" />
      {showArc && <path d="M457,237 H481" stroke={blue} strokeWidth="10" fill="none" />}
    </svg>
  );
}

export function CircleDiagram({ circle }: { circle: NonNullable<Step['circle']> }) {
  const cx = 285,
    cy = 200,
    r = 140,
    px = cx + r * Math.cos(circle.angle),
    py = cy - r * Math.sin(circle.angle);
  const isCos = circle.axis === 'cos',
    qx = isCos ? px : cx,
    qy = isCos ? cy : py;
  return (
    <svg
      viewBox="0 0 760 400"
      role="img"
      aria-label={`Cercle trigonométrique. Angle de mesure ${circle.angle} radians. ${isCos ? 'Le cosinus est l’abscisse du point du cercle ; les pointillés indiquent sa projection orthogonale sur l’axe des abscisses.' : 'Le sinus est l’ordonnée du point du cercle ; les pointillés indiquent sa projection orthogonale sur l’axe des ordonnées.'}`}
    >
      <title>Cercle trigonométrique et projection</title>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={theme.muted} strokeWidth="3" />
      <g stroke={ink} strokeWidth="2" fill="none">
        <path d="M100,200 H475" />
        <path d="M285,380 V20" />
        <path d={`M${cx},${cy} L${px},${py}`} />
      </g>
      <path d={`M${px},${py} L${qx},${qy}`} stroke={blue} strokeWidth="3" strokeDasharray="7 6" />
      <path d={`M${cx},${cy} L${qx},${qy}`} stroke={rust} strokeWidth="6" />
      <circle cx={px} cy={py} r="7" fill={blue} />
      <g fill={ink} fontSize="26">
        <text x="440" y="231">
          1
        </text>
        <text x="108" y="231">
          −1
        </text>
        <text x="300" y="61">
          1
        </text>
        <text x="300" y="355">
          −1
        </text>
        <text x="258" y="230">
          O
        </text>
        <text x="505" y="183" fill={rust}>
          {isCos ? 'cos(x)' : 'sin(x)'}
        </text>
        <text x="505" y="224">
          {isCos ? 'Abscisse' : 'Ordonnée'}
        </text>
      </g>
    </svg>
  );
}

export function GraphSlide({
  graph,
  tex,
  circle,
}: {
  graph?: NonNullable<Step['graph']>;
  tex: string;
  circle?: NonNullable<Step['circle']>;
}) {
  return (
    <div className="graph-slide">
      <MathView display tex={tex} />
      {graph && isTD4Graph(graph) ? (
        <TD4Diagram graph={graph} />
      ) : graph === 'cosine-inequality' || graph === 'cosine-abscissas' ? (
        <CosineInequality showArc={graph === 'cosine-inequality'} />
      ) : graph === 'cosine-equation' || graph === 'sine-cosine-equation' ? (
        <TrigEquation kind={graph} />
      ) : graph ? (
        <ReferenceCurve kind={graph} />
      ) : circle ? (
        <CircleDiagram circle={circle} />
      ) : null}
    </div>
  );
}
