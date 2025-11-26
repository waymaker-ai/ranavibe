# React + TypeScript RANA Example

This is a complete example showing how to use RANA with a React + TypeScript project.

## What's Included

- ✅ Complete `.rana.yml` configuration
- ✅ RANA documentation in `docs/aads/`
- ✅ TypeScript strict mode enabled
- ✅ Example React components following RANA
- ✅ Real API integration (no mocks)
- ✅ Error handling and loading states
- ✅ Production-ready code

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Check RANA compliance
aads check

# Build for production
npm run build
```

## RANA Principles Demonstrated

### 1. Real Data Only (No Mocks)

```typescript
// ❌ DON'T: Mock data
const users = [{ id: 1, name: 'John Doe' }];

// ✅ DO: Real API calls
const users = await userService.getUsers();
```

### 2. Comprehensive Error Handling

```typescript
// ✅ Always handle errors
try {
  const data = await api.fetchData();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  setError(error.message);
}
```

### 3. Loading States

```typescript
// ✅ Show loading indicators
const [loading, setLoading] = useState(false);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
```

### 4. TypeScript Strict Mode

```typescript
// ❌ DON'T: Use 'any'
const data: any = await fetch();

// ✅ DO: Use proper types
interface User {
  id: number;
  name: string;
  email: string;
}
const users: User[] = await userService.getUsers();
```

## File Structure

```
react-typescript/
├── .rana.yml                    # RANA configuration
├── docs/aads/
│   ├── AGENT_INSTRUCTIONS.md    # Development rules
│   └── DEVELOPMENT_CHECKLIST.md # Quality checklist
├── src/
│   ├── components/
│   │   └── UserList.tsx         # Example component
│   ├── services/
│   │   └── userService.ts       # API service (real data)
│   ├── types/
│   │   └── user.ts              # TypeScript types
│   └── App.tsx
├── package.json
├── tsconfig.json                # Strict mode enabled
└── vite.config.ts
```

## RANA Compliance Checklist

This example demonstrates:

- ✅ No mock data - All data from real API
- ✅ TypeScript strict mode enabled
- ✅ No `any` types used
- ✅ Comprehensive error handling
- ✅ Loading states for async operations
- ✅ Empty states when no data
- ✅ Proper TypeScript interfaces
- ✅ Clean file organization
- ✅ Production-ready code

## Learn More

- [RANA Documentation](https://rana.dev)
- [Configuration Guide](https://rana.dev/docs/configuration)
- [Best Practices](https://rana.dev/docs/best-practices)

## License

MIT - Use this as a template for your projects!
