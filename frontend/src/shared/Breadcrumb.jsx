import { Link } from "react-router-dom";

/**
 * items: Array of [label, href?]
 * Last item = current page (no link)
 */
export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map(([label, href], i) => (
        <span key={i} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep">→</span>}
          {href ? <Link to={href}>{label}</Link> : <span>{label}</span>}
        </span>
      ))}
    </nav>
  );
}
