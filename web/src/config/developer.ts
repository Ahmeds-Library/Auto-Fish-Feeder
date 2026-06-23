export const developerProfile = {
  name: 'Mirza Ahmed Hassan',
  role: 'Developer & IoT System Designer',
  github: 'https://github.com/Ahmeds-Library',
  portfolio: '',
  linkedin: 'www.linkedin.com/in/mirza-ahmed-hassan-8bb31a2a5',
  upwork: '',
  email: 'mirzaahmed0303@gmail.com',
} as const;

export type DeveloperLinkKey = 'github' | 'portfolio' | 'linkedin' | 'upwork' | 'email';

export function externalUrl(value: string) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('mailto:')) return value;
  return `https://${value}`;
}
