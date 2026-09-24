import { initials } from '../../utils/formatters';

export default function Avatar({ name, color = '#4F6BFE', size = 34 }) {
  return (
    <div className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  );
}
