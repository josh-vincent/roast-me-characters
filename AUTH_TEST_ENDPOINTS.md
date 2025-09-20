# Auth Callback Test Endpoints

These test endpoints help diagnose issues with the OAuth callback flow and identify potential causes of gateway timeouts.

## Available Test Endpoints

### 1. `/api/auth-debug` - Comprehensive Auth Diagnostics
**Purpose**: Complete health check of auth system
```bash
curl http://localhost:3002/api/auth-debug
```
**Tests**:
- Environment variables
- Cookie status
- Supabase client creation
- Current auth status
- Database connectivity
- User profile status
- Anonymous user status
- OAuth readiness

### 2. `/api/test-auth-callback` - Auth Callback Functions
**Purpose**: Test all callback-related functions
```bash
curl http://localhost:3002/api/test-auth-callback
```
**Tests**:
- Cookie store access
- Supabase client creation
- User authentication status
- Profile existence
- Anonymous user data
- Database response times
- Session validity

### 3. `/api/test-auth-exchange` - Code Exchange Testing
**Purpose**: Test OAuth code exchange with timeout protection
```bash
# Test mode (simulates without real code)
curl http://localhost:3002/api/test-auth-exchange?test=true

# With actual auth code (from OAuth flow)
curl http://localhost:3002/api/test-auth-exchange?code=YOUR_AUTH_CODE
```
**Tests**:
- Code exchange timing
- Timeout handling (5s limit)
- User retrieval speed
- Database query performance
- Total operation time vs Cloudflare limit (30s)

### 4. `/api/test-profile-ops` - Profile Operations
**Purpose**: Test profile creation and lookup speeds
```bash
# Real operations
curl http://localhost:3002/api/test-profile-ops

# Simulation mode
curl http://localhost:3002/api/test-profile-ops?simulate=true
```
**Tests**:
- Profile lookup speed
- Anonymous user check
- Character count queries
- Parallel vs sequential operations
- Profile creation timing (simulated)

### 5. `/api/test-anon-migration` - Anonymous User Migration
**Purpose**: Test anonymous to authenticated user migration
```bash
# Check migration status
curl http://localhost:3002/api/test-anon-migration?action=check

# Simulate migration timing
curl http://localhost:3002/api/test-anon-migration?action=simulate

# Find orphaned anonymous users
curl http://localhost:3002/api/test-anon-migration?action=cleanup
```
**Tests**:
- Anonymous user existence
- Character ownership
- Migration data requirements
- Operation timing
- Cleanup opportunities

## Common Issues & Solutions

### Issue 1: Cloudflare Bad Gateway (502/504)
**Symptoms**: OAuth callback fails with gateway error
**Tests to Run**:
1. `/api/auth-debug` - Check overall health
2. `/api/test-auth-exchange?test=true` - Check timing
3. `/api/test-profile-ops?simulate=true` - Check database speed

**Solutions**:
- If total time > 30s: Use async profile operations
- If database slow: Check Supabase status
- If session exchange slow: Use timeout wrapper

### Issue 2: Profile Not Created
**Symptoms**: User authenticates but no profile exists
**Tests to Run**:
1. `/api/test-auth-callback` - Check profile status
2. `/api/test-profile-ops` - Test creation speed

**Solutions**:
- Check for profile creation errors in logs
- Verify database permissions
- Use callback-simple route temporarily

### Issue 3: Anonymous User Not Migrating
**Symptoms**: Characters don't transfer after login
**Tests to Run**:
1. `/api/test-anon-migration?action=check` - Check migration readiness
2. `/api/test-anon-migration?action=simulate` - Test migration timing

**Solutions**:
- Verify anonymous user cookie exists
- Check character ownership in database
- Review migration logic in callback route

## Performance Benchmarks

Good performance indicators:
- Database queries: < 100ms
- Session exchange: < 2000ms
- Profile creation: < 500ms
- Total callback time: < 5000ms

Warning thresholds:
- Database queries: > 500ms
- Session exchange: > 5000ms
- Total callback time: > 10000ms

Critical thresholds:
- Any operation: > 30000ms (Cloudflare timeout)

## Quick Diagnostics Script

Run all tests in sequence:
```bash
#!/bin/bash
echo "Running Auth Diagnostics..."

echo "\n1. Overall Health:"
curl -s http://localhost:3002/api/auth-debug | jq '.summary'

echo "\n2. Callback Functions:"
curl -s http://localhost:3002/api/test-auth-callback | jq '.summary'

echo "\n3. Profile Operations:"
curl -s http://localhost:3002/api/test-profile-ops?simulate=true | jq '.summary'

echo "\n4. Anonymous Migration:"
curl -s http://localhost:3002/api/test-anon-migration | jq '.summary'

echo "\n5. Exchange Timing (simulated):"
curl -s http://localhost:3002/api/test-auth-exchange?test=true | jq '.summary'
```

## Production Monitoring

For production, monitor these endpoints:
- `/api/health` - Basic health check
- `/api/auth-debug` - Detailed diagnostics (protect with auth)
- Application logs for timeout messages

Set up alerts for:
- Response times > 10s
- Database connection failures
- Session exchange timeouts
- Profile creation errors