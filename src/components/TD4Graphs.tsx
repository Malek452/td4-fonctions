import { theme } from '../theme';

export const td4GraphDescriptions = {
  'domain-extension-a':
    'L’expression initiale est définie pour x strictement positif. La formule simplifiée x³ est définie sur ℝ. Leur égalité est établie seulement sur ]0 ; +∞[ : simplifier ne change pas le domaine de la fonction initiale.',
  'domain-extension-b':
    'L’expression initiale est définie sur ]1 ; +∞[. La formule simplifiée (x² + 1)/(x² − 1) est définie sur ℝ privé de −1 et de 1. Les cercles vides indiquent les bornes exclues. L’égalité reste limitée au domaine initial.',
  'domain-extension-c':
    'L’expression initiale est définie sur ]1 ; +∞[. La formule simplifiée √(x² − 1)/(x(x² + 1)) est définie sur ]−∞ ; −1] union [1 ; +∞[. Ses bornes −1 et 1 sont admises, car la racine carrée peut être nulle. La fonction initiale conserve son domaine ]1 ; +∞[.',
  'odd-function':
    'Courbe représentative de f(x) = x exp(x²). Les points (1 ; e) et (−1 ; −e) sont symétriques par rapport à l’origine. La symétrie de centre O illustre l’identité f(−x) = −f(x), démontrée par le calcul.',
  'non-even-function':
    'Courbe représentative de f(x) = ln(x² + x + 1). Le point d’abscisse −1 a pour ordonnée 0 et le point d’abscisse 1 a pour ordonnée ln(3), strictement positive. Ainsi f(−1) est différent de f(1) et de −f(1) : la fonction n’est ni paire ni impaire.',
  'sine-inequality-ordinates':
    'Le sinus est l’ordonnée du point associé au réel x sur le cercle trigonométrique. Les ordonnées retenues vont de −√2/2 à 1, bornes incluses. Le segment vertical bleu représente ces ordonnées.',
  'sine-inequality-arc':
    'L’arc bleu regroupe les points du cercle d’ordonnée supérieure ou égale à −√2/2. Sur [−π ; π], les solutions sont [−π ; −3π/4] union [−π/4 ; π]. Toutes les bornes sont incluses. Les angles −π et π désignent le même point du cercle.',
  'sine-equality':
    'Deux points de même ordonnée sont symétriques par rapport à l’axe des ordonnées. Pour un angle α, les deux familles d’angles de même sinus sont α + 2kπ et π − α + 2kπ, avec k entier relatif. Ici α = π/6 sert seulement d’illustration.',
  'shifted-sine-equation':
    'En posant y = x + π/3, l’équation devient sin(y) = −1/2. Dans [π/3 ; 7π/3[, les deux angles retenus sont 7π/6 et 11π/6. Soustraire π/3 donne x = 5π/6 et x = 3π/2, qui appartiennent à [0 ; 2π[.',
} as const;

export type TD4Graph = keyof typeof td4GraphDescriptions;
export const isTD4Graph = (graph: string): graph is TD4Graph => graph in td4GraphDescriptions;

const ink = theme.mathInk,
  blue = theme.second,
  rust = theme.active,
  green = theme.base;
const cx = 250,
  cy = 200,
  radius = 140;
const point = (angle: number) => ({
  x: cx + radius * Math.cos(angle),
  y: cy - radius * Math.sin(angle),
});
const pathOf = (
  fn: (x: number) => number,
  a: number,
  b: number,
  X: (x: number) => number,
  Y: (y: number) => number,
) =>
  Array.from({ length: 181 }, (_, i) => {
    const x = a + ((b - a) * i) / 180;
    return `${i ? 'L' : 'M'}${X(x).toFixed(3)},${Y(fn(x)).toFixed(3)}`;
  }).join(' ');

function CircleAxes() {
  return (
    <>
      <circle
        className="unit-circle"
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={theme.muted}
        strokeWidth="3"
      />
      <g stroke={ink} strokeWidth="2" fill="none">
        <path d="M65,200 H435 m-10,-6 10,6 -10,6" />
        <path d="M250,380 V20 m-6,10 6,-10 6,10" />
      </g>
      <g fill={ink} fontSize="24">
        <text x="224" y="229">
          O
        </text>
        <text x="400" y="229">
          1
        </text>
        <text x="76" y="229">
          −1
        </text>
        <text x="265" y="61">
          1
        </text>
        <text x="265" y="356">
          −1
        </text>
      </g>
    </>
  );
}

function DomainComparison({ kind }: { kind: 'a' | 'b' | 'c' }) {
  const X = (x: number) => 380 + 100 * x;
  const start = 90,
    end = 670,
    originalY = 125,
    simplifiedY = 280;
  const bound = kind === 'a' ? 0 : 1;
  const marker = (x: number, y: number, color: string, included: boolean) => (
    <circle
      key={`${x}-${y}`}
      className={included ? 'included-endpoint' : 'excluded-endpoint'}
      data-domain={y === originalY ? 'original' : 'simplified'}
      data-value={x}
      cx={X(x)}
      cy={y}
      r="7"
      fill={included ? color : theme.board}
      stroke={color}
      strokeWidth="3.5"
    />
  );
  return (
    <svg
      viewBox="0 0 760 400"
      role="img"
      aria-label={td4GraphDescriptions[`domain-extension-${kind}`]}
    >
      <title>Comparer les deux ensembles de définition</title>
      <g fontSize="25" fill={ink}>
        <text x="60" y="62" fill={blue}>
          Expression initiale
        </text>
        <text x="455" y="62" fill={blue}>
          {kind === 'a' ? ']0 ; +∞[' : ']1 ; +∞['}
        </text>
        <text x="60" y="218" fill={green}>
          Formule simplifiée
        </text>
        <text x="455" y="218" fill={green}>
          {kind === 'a' ? 'ℝ' : kind === 'b' ? 'ℝ ∖ {−1 ; 1}' : ']−∞ ; −1] ∪ [1 ; +∞['}
        </text>
      </g>
      {[originalY, simplifiedY].map((y) => (
        <g key={y}>
          <path
            d={`M${start},${y} H${end} m-10,-6 10,6 -10,6`}
            stroke={theme.line}
            strokeWidth="2"
            fill="none"
          />
          {[-1, 0, 1].map((x) => (
            <g key={x}>
              <path d={`M${X(x)},${y - 7} V${y + 7}`} stroke={ink} strokeWidth="2" />
              <text x={X(x)} y={y + 38} textAnchor="middle" fill={ink} fontSize="24">
                {x === -1 ? '−1' : x}
              </text>
            </g>
          ))}
          <text x="688" y={y + 7} fill={ink} fontSize="24">
            x
          </text>
        </g>
      ))}
      <path
        d={`M${X(bound)},${originalY} H${end} m-12,-7 12,7 -12,7`}
        stroke={blue}
        strokeWidth="6"
        fill="none"
      />
      {marker(bound, originalY, blue, false)}
      {kind === 'c' ? (
        <path
          d={`M${start + 12},${simplifiedY - 7} l-12,7 12,7 M${start},${simplifiedY} H${X(-1)} M${X(1)},${simplifiedY} H${end} m-12,-7 12,7 -12,7`}
          stroke={green}
          strokeWidth="6"
          fill="none"
        />
      ) : (
        <path
          d={`M${start + 12},${simplifiedY - 7} l-12,7 12,7 M${start},${simplifiedY} H${end} m-12,-7 12,7 -12,7`}
          stroke={green}
          strokeWidth="6"
          fill="none"
        />
      )}
      {kind !== 'a' && [-1, 1].map((x) => marker(x, simplifiedY, green, kind === 'c'))}
      <text x="380" y="380" textAnchor="middle" fill={ink} fontSize="24">
        L’égalité vaut sur le domaine initial.
      </text>
    </svg>
  );
}

function ParityCurve({ odd }: { odd: boolean }) {
  const kind = odd ? 'odd-function' : 'non-even-function';
  const X = (x: number) => 260 + x * 105;
  const Y = (y: number) => (odd ? 200 - y * 23 : 275 - y * 100);
  const fn = odd ? (x: number) => x * Math.exp(x * x) : (x: number) => Math.log(x * x + x + 1);
  const range = odd ? 1.29 : 1.8;
  const points = [-1, 1].map((x) => ({ x, y: fn(x) }));
  return (
    <svg viewBox="0 0 760 400" role="img" aria-label={td4GraphDescriptions[kind]}>
      <title>
        {odd ? 'Une fonction impaire : symétrie de centre O' : 'Une fonction ni paire ni impaire'}
      </title>
      <g stroke={ink} strokeWidth="2" fill="none">
        <path d={`M55,${Y(0)} H465 m-10,-6 10,6 -10,6`} />
        <path d={`M${X(0)},370 V25 m-6,10 6,-10 6,10`} />
      </g>
      {odd && (
        <path
          d={`M${X(-1)},${Y(-Math.E)} L${X(1)},${Y(Math.E)}`}
          stroke={theme.muted}
          strokeWidth="2"
          strokeDasharray="6 6"
        />
      )}
      <path
        d={pathOf(fn, -range, range, X, Y)}
        fill="none"
        stroke={blue}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <g key={p.x}>
          <path
            d={`M${X(p.x)},${Y(0)} V${Y(p.y)} H${X(0)}`}
            fill="none"
            stroke={i ? blue : rust}
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          <circle
            className="function-point"
            data-x={p.x}
            data-y={p.y}
            cx={X(p.x)}
            cy={Y(p.y)}
            r="7"
            fill={i ? blue : rust}
            stroke={theme.board}
            strokeWidth="2"
          />
          <text x={X(p.x)} y={Y(0) + 31} textAnchor="middle" fill={ink} fontSize="24">
            {p.x === -1 ? '−1' : '1'}
          </text>
        </g>
      ))}
      <g fill={ink} fontSize="24">
        <text x={X(0) + 12} y={Y(0) + 31}>
          O
        </text>
        <text x="471" y={Y(0) + 8}>
          x
        </text>
        <text x={X(0) + 15} y="31">
          y
        </text>
        <text x={X(0) - 14} y={Y(odd ? Math.E : Math.log(3)) - 11} textAnchor="end">
          {odd ? 'e' : 'ln 3'}
        </text>
        {odd && (
          <text x={X(0) + 15} y={Y(-Math.E) + 8}>
            −e
          </text>
        )}
        <text x="500" y="112" fill={blue}>
          {odd ? 'f(1) = e' : 'f(1) = ln 3 > 0'}
        </text>
        <text x="500" y="156" fill={rust}>
          {odd ? 'f(−1) = −e' : 'f(−1) = 0'}
        </text>
        {odd ? (
          <>
            <text x="500" y="224">
              Symétrie
            </text>
            <text x="500" y="261">
              de centre O
            </text>
            <text x="500" y="323" fill={green}>
              f(−x) = −f(x)
            </text>
          </>
        ) : (
          <>
            <text x="500" y="224">
              f(−1) ≠ f(1)
            </text>
            <text x="500" y="264">
              f(−1) ≠ −f(1)
            </text>
            <text x="500" y="323" fill={green}>
              Ni paire ni impaire
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

function SineInequality({ arc }: { arc: boolean }) {
  const kind = arc ? 'sine-inequality-arc' : 'sine-inequality-ordinates';
  const lower = -Math.SQRT1_2,
    cutoff = cy - radius * lower;
  const left = point((-3 * Math.PI) / 4),
    right = point(-Math.PI / 4);
  return (
    <svg viewBox="0 0 760 400" role="img" aria-label={td4GraphDescriptions[kind]}>
      <title>
        {arc
          ? 'L’arc des points d’ordonnée supérieure ou égale au seuil'
          : 'Les ordonnées supérieures ou égales au seuil'}
      </title>
      <CircleAxes />
      <path d={`M65,${cutoff} H435`} stroke={rust} strokeWidth="3" strokeDasharray="8 6" />
      <path d={`M${cx},${cutoff} V${cy - radius}`} stroke={blue} strokeWidth="6" />
      <g fill={blue} stroke={theme.board} strokeWidth="2">
        <circle cx={cx} cy={cutoff} r="6.5" />
        <circle cx={cx} cy={cy - radius} r="6.5" />
      </g>
      {arc && (
        <>
          <path
            className="solution-arc"
            d={`M${right.x},${right.y} A${radius},${radius} 0 1 0 ${left.x},${left.y}`}
            stroke={blue}
            strokeWidth="9"
            fill="none"
          />
          {[left, right].map((p, i) => (
            <circle
              key={i}
              className="solution-point included-endpoint"
              data-angle-radians={i === 0 ? (-3 * Math.PI) / 4 : -Math.PI / 4}
              cx={p.x}
              cy={p.y}
              r="7"
              fill={blue}
              stroke={theme.board}
              strokeWidth="2"
            />
          ))}
          <circle cx={cx - radius} cy={cy} r="7" fill={blue} stroke={theme.board} strokeWidth="2" />
        </>
      )}
      <g fill={ink} fontSize="24">
        <text x="475" y="103" fill={rust}>
          Seuil : −√2/2
        </text>
        <text x="475" y="159" fill={blue}>
          Ordonnées retenues
        </text>
        <text x="475" y="197" fill={blue}>
          de −√2/2 à 1
        </text>
        {arc ? (
          <>
            <text x="475" y="254">
              Bornes incluses
            </text>
            <text x="475" y="310">
              −π et π :
            </text>
            <text x="475" y="347">
              un même point
            </text>
            <text x={left.x - 64} y={left.y + 35}>
              −3π/4
            </text>
            <text x={right.x + 7} y={right.y + 35}>
              −π/4
            </text>
            <text x="20" y="179" fill={blue} fontSize="22">
              −π ; π
            </text>
          </>
        ) : (
          <>
            <text x="475" y="254">
              Deux bornes incluses
            </text>
            <text x="475" y="310">
              sin(x) est
            </text>
            <text x="475" y="347">
              une ordonnée.
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

function EqualSines({ shifted }: { shifted: boolean }) {
  const kind = shifted ? 'shifted-sine-equation' : 'sine-equality';
  const angles = shifted
    ? [(7 * Math.PI) / 6, (11 * Math.PI) / 6]
    : [Math.PI / 6, (5 * Math.PI) / 6];
  const points = angles.map(point),
    ordinate = shifted ? -0.5 : 0.5;
  const y = cy - radius * ordinate;
  return (
    <svg viewBox="0 0 760 400" role="img" aria-label={td4GraphDescriptions[kind]}>
      <title>
        {shifted
          ? 'Deux angles de sinus −1/2, puis retour à x'
          : 'Les deux familles d’angles de même sinus'}
      </title>
      <CircleAxes />
      <path d={`M65,${y} H435`} stroke={rust} strokeWidth="3" strokeDasharray="8 6" />
      <path d={`M${cx},${cy} V${y}`} stroke={blue} strokeWidth="6" />
      {points.map((p, i) => (
        <g key={i}>
          <path
            d={`M${cx},${cy} L${p.x},${p.y}`}
            stroke={theme.muted}
            strokeWidth="2"
            fill="none"
          />
          <circle
            className="solution-point"
            data-angle-radians={angles[i]}
            cx={p.x}
            cy={p.y}
            r="7"
            fill={blue}
            stroke={theme.board}
            strokeWidth="2"
          />
          <text
            x={shifted ? (i === 0 ? 65 : 357) : i === 0 ? p.x + 13 : 65}
            y={shifted ? 328 : i === 0 ? p.y - 17 : 100}
            fill={blue}
            fontSize="25"
          >
            {shifted ? ['7π/6', '11π/6'][i] : ['α', 'π − α'][i]}
          </text>
        </g>
      ))}
      <g fill={ink} fontSize="24">
        <text x="475" y="94" fill={rust}>
          {shifted ? 'Ordonnée : −1/2' : 'Même ordonnée'}
        </text>
        {shifted ? (
          <>
            <text x="475" y="154">
              y = x + π/3
            </text>
            <text x="475" y="194">
              x = y − π/3
            </text>
            <text x="475" y="257" fill={green}>
              7π/6 → 5π/6
            </text>
            <text x="475" y="299" fill={green}>
              11π/6 → 3π/2
            </text>
            <text x="475" y="357">
              x ∈ [0 ; 2π[
            </text>
          </>
        ) : (
          <>
            <text x="475" y="154">
              A = α + 2kπ
            </text>
            <text x="475" y="193">
              ou
            </text>
            <text x="475" y="232">
              A = π − α + 2kπ
            </text>
            <text x="475" y="284">
              k ∈ ℤ
            </text>
            <text x="475" y="347" fill={theme.muted}>
              Exemple : α = π/6
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

export function TD4Diagram({ graph }: { graph: TD4Graph }) {
  switch (graph) {
    case 'domain-extension-a':
      return <DomainComparison kind="a" />;
    case 'domain-extension-b':
      return <DomainComparison kind="b" />;
    case 'domain-extension-c':
      return <DomainComparison kind="c" />;
    case 'odd-function':
      return <ParityCurve odd />;
    case 'non-even-function':
      return <ParityCurve odd={false} />;
    case 'sine-inequality-ordinates':
      return <SineInequality arc={false} />;
    case 'sine-inequality-arc':
      return <SineInequality arc />;
    case 'sine-equality':
      return <EqualSines shifted={false} />;
    case 'shifted-sine-equation':
      return <EqualSines shifted />;
  }
}
