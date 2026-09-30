/**
 * Der Rahmen, auf dem jedes Symbol gezeichnet wird.
 *
 * Er legt fest, was alle gemeinsam haben: das Raster (24×24), die
 * Strichstärke, die runden Enden – und `stroke="currentColor"`. Das Symbol
 * nimmt damit die Textfarbe seiner Umgebung an; ein `className="text-gold"`
 * genügt, und es ist golden.
 *
 * `aria-hidden`, weil ein Symbol neben einem Wort nichts Neues sagt. Steht
 * es allein auf einem Knopf, trägt der Knopf das `aria-label`.
 *
 * @param {{ size?: number, children: import('react').ReactNode }} props
 *   weitere Eigenschaften (title, className …) gehen ans <svg>
 */
export default function Icon({ size = 20, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}
