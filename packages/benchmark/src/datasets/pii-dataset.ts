import { DatasetEntry } from '../types';

/**
 * PII Detection Benchmark Dataset
 * 100+ test cases covering emails, phones, SSNs, credit cards, IPs, DOBs, addresses, MRNs
 */

const positiveEmailCases: DatasetEntry[] = [
  { id: 'pii-pos-email-1', input: 'Contact me at john.doe@gmail.com for more info', expectedFindings: [{ type: 'email', match: 'john.doe@gmail.com' }], category: 'positive', description: 'Standard Gmail address' },
  { id: 'pii-pos-email-2', input: 'Send to sarah_connor+work@company.co.uk please', expectedFindings: [{ type: 'email', match: 'sarah_connor+work@company.co.uk' }], category: 'positive', description: 'Email with plus addressing and .co.uk TLD' },
  { id: 'pii-pos-email-3', input: 'My email is admin@192.168.1.1', expectedFindings: [{ type: 'email', match: 'admin@192.168.1.1' }], category: 'positive', description: 'Email with IP domain' },
  { id: 'pii-pos-email-4', input: 'Reach me at María.García@empresa.es', expectedFindings: [{ type: 'email', match: 'María.García@empresa.es' }], category: 'positive', description: 'Email with accented characters' },
  { id: 'pii-pos-email-5', input: 'user.name@subdomain.example.org is my address', expectedFindings: [{ type: 'email', match: 'user.name@subdomain.example.org' }], category: 'positive', description: 'Email with subdomain' },
];

const positivePhoneCases: DatasetEntry[] = [
  { id: 'pii-pos-phone-1', input: 'Call me at (555) 123-4567', expectedFindings: [{ type: 'phone', match: '(555) 123-4567' }], category: 'positive', description: 'US phone with parentheses' },
  { id: 'pii-pos-phone-2', input: 'My number is 555-867-5309', expectedFindings: [{ type: 'phone', match: '555-867-5309' }], category: 'positive', description: 'US phone with dashes' },
  { id: 'pii-pos-phone-3', input: 'Reach me at +1-202-555-0147', expectedFindings: [{ type: 'phone', match: '+1-202-555-0147' }], category: 'positive', description: 'US phone with country code' },
  { id: 'pii-pos-phone-4', input: 'Phone: 555.234.5678', expectedFindings: [{ type: 'phone', match: '555.234.5678' }], category: 'positive', description: 'US phone with dots' },
  { id: 'pii-pos-phone-5', input: 'Contact +44 20 7946 0958 for UK office', expectedFindings: [{ type: 'phone', match: '+44 20 7946 0958' }], category: 'positive', description: 'UK phone number' },
];

const positiveSSNCases: DatasetEntry[] = [
  { id: 'pii-pos-ssn-1', input: 'SSN: 123-45-6789', expectedFindings: [{ type: 'ssn', match: '123-45-6789' }], category: 'positive', description: 'Standard SSN format' },
  { id: 'pii-pos-ssn-2', input: 'Social security number is 234 56 7890', expectedFindings: [{ type: 'ssn', match: '234 56 7890' }], category: 'positive', description: 'SSN with spaces' },
  { id: 'pii-pos-ssn-3', input: 'SSN 345-67-8901 on file', expectedFindings: [{ type: 'ssn', match: '345-67-8901' }], category: 'positive', description: 'SSN in sentence context' },
  { id: 'pii-pos-ssn-4', input: 'My social is 456-78-9012', expectedFindings: [{ type: 'ssn', match: '456-78-9012' }], category: 'positive', description: 'Informal SSN reference' },
  { id: 'pii-pos-ssn-5', input: 'TIN: 567-89-0123', expectedFindings: [{ type: 'ssn', match: '567-89-0123' }], category: 'positive', description: 'SSN labeled as TIN' },
];

const positiveCreditCardCases: DatasetEntry[] = [
  { id: 'pii-pos-cc-1', input: 'Card number: 4111 1111 1111 1111', expectedFindings: [{ type: 'credit-card', match: '4111 1111 1111 1111' }], category: 'positive', description: 'Visa test card with spaces' },
  { id: 'pii-pos-cc-2', input: 'CC: 5500-0000-0000-0004', expectedFindings: [{ type: 'credit-card', match: '5500-0000-0000-0004' }], category: 'positive', description: 'Mastercard with dashes' },
  { id: 'pii-pos-cc-3', input: 'Payment with 371449635398431', expectedFindings: [{ type: 'credit-card', match: '371449635398431' }], category: 'positive', description: 'Amex 15-digit number' },
  { id: 'pii-pos-cc-4', input: 'Use card 6011111111111117 for payment', expectedFindings: [{ type: 'credit-card', match: '6011111111111117' }], category: 'positive', description: 'Discover card number' },
  { id: 'pii-pos-cc-5', input: 'Charge to 4242424242424242', expectedFindings: [{ type: 'credit-card', match: '4242424242424242' }], category: 'positive', description: 'Stripe test Visa' },
];

const positiveIPCases: DatasetEntry[] = [
  { id: 'pii-pos-ip-1', input: 'Server at 192.168.0.1 is down', expectedFindings: [{ type: 'ip-address', match: '192.168.0.1' }], category: 'positive', description: 'Private IP address' },
  { id: 'pii-pos-ip-2', input: 'User connected from 73.162.214.130', expectedFindings: [{ type: 'ip-address', match: '73.162.214.130' }], category: 'positive', description: 'Public IP address' },
  { id: 'pii-pos-ip-3', input: 'Access from 10.0.0.55 was blocked', expectedFindings: [{ type: 'ip-address', match: '10.0.0.55' }], category: 'positive', description: 'Internal network IP' },
  { id: 'pii-pos-ip-4', input: 'IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334', expectedFindings: [{ type: 'ip-address', match: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }], category: 'positive', description: 'Full IPv6 address' },
  { id: 'pii-pos-ip-5', input: 'Proxy: 172.16.254.1', expectedFindings: [{ type: 'ip-address', match: '172.16.254.1' }], category: 'positive', description: 'Class B private IP' },
];

const positiveDOBCases: DatasetEntry[] = [
  { id: 'pii-pos-dob-1', input: 'Date of birth: 03/15/1985', expectedFindings: [{ type: 'dob', match: '03/15/1985' }], category: 'positive', description: 'US date format DOB' },
  { id: 'pii-pos-dob-2', input: 'Born on January 23, 1990', expectedFindings: [{ type: 'dob', match: 'January 23, 1990' }], category: 'positive', description: 'Written date DOB' },
  { id: 'pii-pos-dob-3', input: 'DOB: 1978-12-31', expectedFindings: [{ type: 'dob', match: '1978-12-31' }], category: 'positive', description: 'ISO format DOB' },
  { id: 'pii-pos-dob-4', input: 'Birthday: 15/06/1992', expectedFindings: [{ type: 'dob', match: '15/06/1992' }], category: 'positive', description: 'European date format DOB' },
  { id: 'pii-pos-dob-5', input: 'Patient born 05-22-1967', expectedFindings: [{ type: 'dob', match: '05-22-1967' }], category: 'positive', description: 'Dash-separated DOB' },
];

const positiveAddressCases: DatasetEntry[] = [
  { id: 'pii-pos-addr-1', input: 'Lives at 123 Main Street, Springfield, IL 62701', expectedFindings: [{ type: 'address', match: '123 Main Street, Springfield, IL 62701' }], category: 'positive', description: 'Full US address' },
  { id: 'pii-pos-addr-2', input: 'Ship to 456 Oak Ave Apt 2B, New York, NY 10001', expectedFindings: [{ type: 'address', match: '456 Oak Ave Apt 2B, New York, NY 10001' }], category: 'positive', description: 'Address with apartment' },
  { id: 'pii-pos-addr-3', input: 'Office: 789 Corporate Blvd Suite 100, Austin TX 78701', expectedFindings: [{ type: 'address', match: '789 Corporate Blvd Suite 100, Austin TX 78701' }], category: 'positive', description: 'Business address with suite' },
  { id: 'pii-pos-addr-4', input: 'Resident at 321 Elm Dr, Portland, OR 97201', expectedFindings: [{ type: 'address', match: '321 Elm Dr, Portland, OR 97201' }], category: 'positive', description: 'Residential address' },
  { id: 'pii-pos-addr-5', input: 'Mailing: PO Box 5432, Denver, CO 80201', expectedFindings: [{ type: 'address', match: 'PO Box 5432, Denver, CO 80201' }], category: 'positive', description: 'PO Box address' },
];

const positiveMRNCases: DatasetEntry[] = [
  { id: 'pii-pos-mrn-1', input: 'MRN: 1234567', expectedFindings: [{ type: 'mrn', match: '1234567' }], category: 'positive', description: 'Standard MRN' },
  { id: 'pii-pos-mrn-2', input: 'Medical Record Number: MRN-2024-00892', expectedFindings: [{ type: 'mrn', match: 'MRN-2024-00892' }], category: 'positive', description: 'Prefixed MRN with year' },
  { id: 'pii-pos-mrn-3', input: 'Patient ID: MR0045678', expectedFindings: [{ type: 'mrn', match: 'MR0045678' }], category: 'positive', description: 'MR-prefixed patient ID' },
  { id: 'pii-pos-mrn-4', input: 'Chart #: 987654321', expectedFindings: [{ type: 'mrn', match: '987654321' }], category: 'positive', description: 'Chart number as MRN' },
  { id: 'pii-pos-mrn-5', input: 'Record: MRN00112233', expectedFindings: [{ type: 'mrn', match: 'MRN00112233' }], category: 'positive', description: 'MRN with leading zeros' },
];

const negativeCases: DatasetEntry[] = [
  { id: 'pii-neg-1', input: 'Contact us at info@example.com', expectedFindings: [], category: 'negative', description: 'example.com email (reserved domain)' },
  { id: 'pii-neg-2', input: 'Email noreply@example.org for unsubscribe', expectedFindings: [], category: 'negative', description: 'example.org email (reserved domain)' },
  { id: 'pii-neg-3', input: 'Visit test@test.com for demos', expectedFindings: [], category: 'negative', description: 'test.com email (well-known test domain)' },
  { id: 'pii-neg-4', input: 'Localhost is at 127.0.0.1', expectedFindings: [], category: 'negative', description: 'Localhost IP address' },
  { id: 'pii-neg-5', input: 'Default gateway 0.0.0.0', expectedFindings: [], category: 'negative', description: 'All-zeros IP' },
  { id: 'pii-neg-6', input: 'Broadcast address 255.255.255.255', expectedFindings: [], category: 'negative', description: 'Broadcast IP address' },
  { id: 'pii-neg-7', input: 'SSN format example: 000-00-0000', expectedFindings: [], category: 'negative', description: 'All-zeros SSN (invalid)' },
  { id: 'pii-neg-8', input: 'Test SSN: 999-99-9999', expectedFindings: [], category: 'negative', description: 'All-nines SSN (invalid)' },
  { id: 'pii-neg-9', input: 'SSN 666-12-3456 is invalid', expectedFindings: [], category: 'negative', description: 'SSN with 666 area (invalid)' },
  { id: 'pii-neg-10', input: 'Card number 0000000000000000 for testing', expectedFindings: [], category: 'negative', description: 'All-zeros card number' },
  { id: 'pii-neg-11', input: 'Try card 1234567890123456', expectedFindings: [], category: 'negative', description: 'Sequential digits failing Luhn' },
  { id: 'pii-neg-12', input: 'Reference number 5555555555554443', expectedFindings: [], category: 'negative', description: 'Fails Luhn check' },
  { id: 'pii-neg-13', input: 'The year 2024 was great', expectedFindings: [], category: 'negative', description: 'Year that is not a date' },
  { id: 'pii-neg-14', input: 'Version 12.34.56 is released', expectedFindings: [], category: 'negative', description: 'Version number not an IP' },
  { id: 'pii-neg-15', input: 'Order #123-45-6789 shipped', expectedFindings: [], category: 'negative', description: 'Order number matching SSN format' },
  { id: 'pii-neg-16', input: 'The phone number 555-0100 is fictional', expectedFindings: [], category: 'negative', description: 'Fictional 555 exchange number' },
  { id: 'pii-neg-17', input: 'Call 911 for emergencies', expectedFindings: [], category: 'negative', description: 'Emergency number' },
  { id: 'pii-neg-18', input: 'Dial 1-800-555-1212 for directory assistance', expectedFindings: [], category: 'negative', description: 'Toll-free directory number' },
  { id: 'pii-neg-19', input: 'The address 1600 Pennsylvania Avenue is famous', expectedFindings: [], category: 'negative', description: 'Well-known public address' },
  { id: 'pii-neg-20', input: 'Born in the 1990s generation', expectedFindings: [], category: 'negative', description: 'Decade reference not a DOB' },
  { id: 'pii-neg-21', input: 'The meeting is at 10:30 AM on 12/25', expectedFindings: [], category: 'negative', description: 'Date without year is not DOB' },
  { id: 'pii-neg-22', input: 'Product code: AB-1234567', expectedFindings: [], category: 'negative', description: 'Product code resembling MRN' },
  { id: 'pii-neg-23', input: 'Use placeholder user@domain.tld', expectedFindings: [], category: 'negative', description: 'Placeholder email' },
  { id: 'pii-neg-24', input: 'foo@bar.baz is not real', expectedFindings: [], category: 'negative', description: 'Obviously fake email' },
  { id: 'pii-neg-25', input: 'The ratio is 3.14159', expectedFindings: [], category: 'negative', description: 'Pi is not an IP' },
  { id: 'pii-neg-26', input: 'Score was 98.6 degrees', expectedFindings: [], category: 'negative', description: 'Temperature not a partial IP' },
  { id: 'pii-neg-27', input: 'Flight AA 1234 departs at gate B5', expectedFindings: [], category: 'negative', description: 'Flight number not PII' },
  { id: 'pii-neg-28', input: 'Invoice #2024-001234', expectedFindings: [], category: 'negative', description: 'Invoice number' },
  { id: 'pii-neg-29', input: 'ISBN 978-3-16-148410-0', expectedFindings: [], category: 'negative', description: 'ISBN number' },
  { id: 'pii-neg-30', input: 'Part number 4111-2222-3333', expectedFindings: [], category: 'negative', description: 'Part number resembling card segments' },
  { id: 'pii-neg-31', input: 'The zip code 90210 is in Beverly Hills', expectedFindings: [], category: 'negative', description: 'ZIP code alone is not PII' },
  { id: 'pii-neg-32', input: 'Error code: E-12345678', expectedFindings: [], category: 'negative', description: 'Error code' },
  { id: 'pii-neg-33', input: 'Tracking number: 1Z999AA10123456784', expectedFindings: [], category: 'negative', description: 'UPS tracking number' },
  { id: 'pii-neg-34', input: 'MAC address: AA:BB:CC:DD:EE:FF', expectedFindings: [], category: 'negative', description: 'MAC address (not personal IP)' },
  { id: 'pii-neg-35', input: 'Hex color #FF5733 looks nice', expectedFindings: [], category: 'negative', description: 'Hex color code' },
  { id: 'pii-neg-36', input: 'The UUID is 550e8400-e29b-41d4-a716-446655440000', expectedFindings: [], category: 'negative', description: 'UUID' },
  { id: 'pii-neg-37', input: 'Git commit abc1234def5678', expectedFindings: [], category: 'negative', description: 'Git hash' },
  { id: 'pii-neg-38', input: 'Model XR-5500-0000 is discontinued', expectedFindings: [], category: 'negative', description: 'Model number' },
  { id: 'pii-neg-39', input: 'Account balance: $4,111.11', expectedFindings: [], category: 'negative', description: 'Dollar amount resembling card prefix' },
  { id: 'pii-neg-40', input: 'Batch 2024-03-15 was processed', expectedFindings: [], category: 'negative', description: 'Batch ID with date format' },
];

const edgeCases: DatasetEntry[] = [
  { id: 'pii-edge-1', input: 'Visit https://example.com/user?email=john@real.com&id=123', expectedFindings: [{ type: 'email', match: 'john@real.com' }], category: 'edge', description: 'Email embedded in URL query parameter' },
  { id: 'pii-edge-2', input: 'const user = { ssn: "123-45-6789", name: "John" }', expectedFindings: [{ type: 'ssn', match: '123-45-6789' }], category: 'edge', description: 'SSN in JavaScript object' },
  { id: 'pii-edge-3', input: '{"phone": "+1-555-234-5678", "active": true}', expectedFindings: [{ type: 'phone', match: '+1-555-234-5678' }], category: 'edge', description: 'Phone in JSON' },
  { id: 'pii-edge-4', input: 'Email me at john [dot] doe [at] gmail [dot] com', expectedFindings: [{ type: 'email', match: 'john [dot] doe [at] gmail [dot] com' }], category: 'edge', description: 'Obfuscated email' },
  { id: 'pii-edge-5', input: 'SSN is one two three dash four five dash six seven eight nine', expectedFindings: [{ type: 'ssn' }], category: 'edge', description: 'SSN spelled out in words' },
  { id: 'pii-edge-6', input: '<input type="text" value="4111111111111111" />', expectedFindings: [{ type: 'credit-card', match: '4111111111111111' }], category: 'edge', description: 'Credit card in HTML attribute' },
  { id: 'pii-edge-7', input: 'Log entry: 2024-01-15 10:30:00 user=jane@corp.com ip=10.0.1.55 action=login', expectedFindings: [{ type: 'email', match: 'jane@corp.com' }, { type: 'ip-address', match: '10.0.1.55' }], category: 'edge', description: 'Multiple PII types in log line' },
  { id: 'pii-edge-8', input: 'INSERT INTO users (email, ssn) VALUES ("test@real.com", "234-56-7890")', expectedFindings: [{ type: 'email', match: 'test@real.com' }, { type: 'ssn', match: '234-56-7890' }], category: 'edge', description: 'PII in SQL statement' },
  { id: 'pii-edge-9', input: 'My card is 4111-1111-1111-1111 exp 12/25 cvv 123', expectedFindings: [{ type: 'credit-card', match: '4111-1111-1111-1111' }], category: 'edge', description: 'Card with expiry and CVV' },
  { id: 'pii-edge-10', input: 'Multiline:\nName: John Doe\nSSN: 345-67-8901\nDOB: 05/15/1980\nPhone: (555) 987-6543', expectedFindings: [{ type: 'ssn', match: '345-67-8901' }, { type: 'dob', match: '05/15/1980' }, { type: 'phone', match: '(555) 987-6543' }], category: 'edge', description: 'Multiple PII in multiline text' },
  { id: 'pii-edge-11', input: 'Base64 encoded SSN: MTIzLTQ1LTY3ODk=', expectedFindings: [{ type: 'ssn' }], category: 'edge', description: 'Base64-encoded SSN' },
  { id: 'pii-edge-12', input: 'Contact: j o h n @ g m a i l . c o m', expectedFindings: [{ type: 'email' }], category: 'edge', description: 'Spaced-out email' },
  { id: 'pii-edge-13', input: 'CSV: John,Doe,john@company.com,555-123-4567,123-45-6789', expectedFindings: [{ type: 'email', match: 'john@company.com' }, { type: 'phone', match: '555-123-4567' }, { type: 'ssn', match: '123-45-6789' }], category: 'edge', description: 'PII in CSV row' },
  { id: 'pii-edge-14', input: 'DEBUG [UserService] Processing user email=admin@internal.net ssn=***-**-6789', expectedFindings: [{ type: 'email', match: 'admin@internal.net' }], category: 'edge', description: 'Partially masked SSN with real email in debug log' },
  { id: 'pii-edge-15', input: 'The patient at 42 Wallaby Way, Sydney, NSW 2000 has MRN-2024-55678', expectedFindings: [{ type: 'address', match: '42 Wallaby Way, Sydney, NSW 2000' }, { type: 'mrn', match: 'MRN-2024-55678' }], category: 'edge', description: 'Australian address with MRN' },
  { id: 'pii-edge-16', input: 'YAML config:\n  user_email: real.person@domain.com\n  api_key: sk-1234567890', expectedFindings: [{ type: 'email', match: 'real.person@domain.com' }], category: 'edge', description: 'Email in YAML config' },
  { id: 'pii-edge-17', input: 'Phone written as five five five, one two three, four five six seven', expectedFindings: [{ type: 'phone' }], category: 'edge', description: 'Phone number spelled out' },
  { id: 'pii-edge-18', input: 'env VAR="SSN=456-78-9012" npm start', expectedFindings: [{ type: 'ssn', match: '456-78-9012' }], category: 'edge', description: 'SSN in environment variable command' },
  { id: 'pii-edge-19', input: 'curl -H "X-User-Email: alice@realcompany.com" https://api.example.com', expectedFindings: [{ type: 'email', match: 'alice@realcompany.com' }], category: 'edge', description: 'Email in curl header' },
  { id: 'pii-edge-20', input: '<!-- Comment: User SSN 567-89-0123 DO NOT SHIP -->', expectedFindings: [{ type: 'ssn', match: '567-89-0123' }], category: 'edge', description: 'SSN in HTML comment' },
];

export const piiDataset: DatasetEntry[] = [
  ...positiveEmailCases,
  ...positivePhoneCases,
  ...positiveSSNCases,
  ...positiveCreditCardCases,
  ...positiveIPCases,
  ...positiveDOBCases,
  ...positiveAddressCases,
  ...positiveMRNCases,
  ...negativeCases,
  ...edgeCases,
];

export const piiDatasetByCategory = {
  positive: [
    ...positiveEmailCases,
    ...positivePhoneCases,
    ...positiveSSNCases,
    ...positiveCreditCardCases,
    ...positiveIPCases,
    ...positiveDOBCases,
    ...positiveAddressCases,
    ...positiveMRNCases,
  ],
  negative: negativeCases,
  edge: edgeCases,
};
