import { useMemo } from 'react';
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js/min';

export const DEFAULT_COUNTRY = 'MY';

function flag(code: string) {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function useCountryOptions() {
  return useMemo(() => {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    return getCountries()
      .map((code) => ({
        code,
        label: `${flag(code)} ${names.of(code) ?? code} (+${getCountryCallingCode(code as CountryCode)})`,
        name: names.of(code) ?? code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

interface Props {
  id: string;
  country: string;
  phone: string;
  onCountry: (code: string) => void;
  onPhone: (value: string) => void;
  required?: boolean;
}

export function PhoneField({ id, country, phone, onCountry, onPhone, required }: Props) {
  const options = useCountryOptions();
  const dial = getCountryCallingCode(country as CountryCode);
  return (
    <div className="phone-field">
      <select aria-label="Country" value={country} onChange={(e) => onCountry(e.target.value)}>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="phone-number">
        <span className="dial" aria-hidden="true">
          +{dial}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={country === 'MY' ? '12-345 6789' : 'Phone number'}
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}
