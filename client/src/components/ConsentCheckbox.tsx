import { Link } from 'react-router-dom';

export default function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-xs text-[#6B6B6B] leading-relaxed cursor-pointer">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#1A1A1A]"
      />
      <span>
        Я даю{' '}
        <Link to="/personal-data-consent" target="_blank" className="underline hover:text-[#C4A882]">
          согласие на обработку персональных данных
        </Link>{' '}
        и ознакомлен(а) с{' '}
        <Link to="/privacy" target="_blank" className="underline hover:text-[#C4A882]">
          Политикой обработки персональных данных
        </Link>
        .
      </span>
    </label>
  );
}
