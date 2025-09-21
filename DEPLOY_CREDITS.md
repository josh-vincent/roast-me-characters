# Deploying the Daily Credits System

## Quick Deploy via Supabase Dashboard (Recommended)

Since your project is currently paused, the easiest way is through the Supabase Dashboard:

1. **Go to SQL Editor**: 
   https://supabase.com/dashboard/project/xpndmfhitpkbzhinfprf/sql/new

2. **Copy and paste the migration** from:
   `supabase/migrations/20250122_add_daily_credits_system.sql`

3. **Click "Run" to execute**

## Alternative: Deploy via Supabase CLI

If you prefer using the CLI:

```bash
# 1. Login to Supabase
supabase login

# 2. Link your project
supabase link --project-ref xpndmfhitpkbzhinfprf

# 3. Push the migration
supabase db push
```

## What This Migration Does

### Database Changes:
- Creates/updates `profiles` table with daily credit tracking
- Adds `daily_credits_used` (0-3 per day)
- Adds `daily_credits_reset_at` (tracks last reset)
- Adds `lifetime_credits_purchased` (permanent credits)

### New Functions:
- `get_credit_balance()` - Returns daily & purchased credits
- `use_credits()` - Deducts credits (daily first, then purchased)
- `reset_daily_credits()` - Auto-resets at midnight

### How Credits Work:
1. **Daily Credits**: Every user gets 3 free credits per day
2. **Auto-Reset**: Credits reset automatically at midnight UTC
3. **Priority**: System uses daily credits first, then purchased
4. **Tracking**: All usage logged in `credit_transactions` table

## Testing the System

After deploying, test in your app:

1. **Check Credit Balance**:
```sql
SELECT * FROM get_credit_balance('YOUR_USER_ID');
```

2. **Use Credits**:
```sql
SELECT * FROM use_credits('YOUR_USER_ID', 1, 'Test generation');
```

3. **View User Credits**:
```sql
SELECT 
  daily_credits_used,
  daily_credits_reset_at,
  credits as purchased_credits,
  (3 - daily_credits_used) as daily_available
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

## UI Updates Already Done

The app code has been updated to:
- Show daily vs purchased credits separately
- Display "Daily: 2/3" and "Purchased: 5" 
- Use the new `getCreditBalance()` function
- Automatically handle the credit priority

## Troubleshooting

### If profiles table doesn't exist:
The migration creates it automatically

### If functions already exist:
The migration uses `CREATE OR REPLACE` so it's safe to re-run

### To manually reset someone's daily credits:
```sql
UPDATE profiles 
SET daily_credits_used = 0, 
    daily_credits_reset_at = NOW() 
WHERE id = 'USER_ID';
```

### To give someone purchased credits:
```sql
UPDATE profiles 
SET credits = credits + 10 
WHERE id = 'USER_ID';
```

## Next Steps

1. Deploy the migration
2. Test with a user account
3. Monitor credit usage in the dashboard
4. Adjust daily limit if needed (change `3` in the functions)