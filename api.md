# YesCode API Endpoints

This document outlines the API endpoints used by the YesCode extension.

## Base URLs
- **Production**: `https://co.yes.vg`
- **Test**: `https://cotest.yes.vg`

## Authentication
All API requests require the `X-API-Key` header for authentication.

---

## 1. Balances & Profile (Active)

The primary endpoint used to fetch the user's profile and all associated balances. It is also used to validate the API key and detect the environment.

### Get Profile & Balances
- **Method**: `GET`
- **Endpoint**: `/api/v1/auth/profile`
- **Headers**:
  - `X-API-Key`: `<your_api_key>`
- **Description**: Validates the API key and retrieves a comprehensive profile object (`ProfileResponse`) that contains both User and Team balance data.

This endpoint's response is logically divided into the following balance categories:

#### A. User Balances
- **Subscription**: Reflected via `subscription_balance`, `subscription_plan`, `subscription_expiry`, and `current_week_spend`.
- **Pay-As-You-Go (PayGo)**: Reflected via `pay_as_you_go_balance`.

#### B. Team Balances
- **Team**: Reflected via the `current_team` object (which includes `daily_balance`, `per_user_daily_balance`, `weekly_limit`) and the `team_membership` object (which includes `current_week_spend`, `daily_subscription_spending`, etc.).

#### Example Request (cURL)
```bash
curl -X GET "https://co.yes.vg/api/v1/auth/profile" \
  -H "X-API-Key: your_api_key_here"
```

#### Example Request (JavaScript/TypeScript)
```typescript
const response = await fetch('https://co.yes.vg/api/v1/auth/profile', {
    method: 'GET',
    headers: {
        'X-API-Key': 'your_api_key_here'
    }
});

const data = await response.json();
console.log(data);
```

#### Example Response
```json
{
  "accent_color_hsl": "10 50% 50%",
  "accent_color_name": "custom",
  "api_key": "cr_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "balance": 100.0,
  "balance_preference": "subscription_first",
  "created_at": "2024-01-01T00:00:00.000000+00:00",
  "credit_balance": 0,
  "current_month_spend": 10.0,
  "current_team": {
    "name": "My Dev Team",
    "daily_balance": 100,
    "per_user_daily_balance": 20,
    "weekly_limit": 500
  },
  "current_team_id": 12,
  "current_week_spend": 5.0,
  "default_chat_model": "",
  "email": "user@example.com",
  "email_verified": true,
  "id": 1000,
  "is_suspended": false,
  "last_daily_balance_add": "2024-06-01T00:00:00.000000+00:00",
  "last_month_reset": "2024-05-01T00:00:00.000000+00:00",
  "last_week_reset": "2024-05-27T00:00:00.000000+00:00",
  "oauth_id": 999,
  "pay_as_you_go_balance": 50.0,
  "pending_team_plan_days": 0,
  "pending_team_plan_id": null,
  "referral_code": "user_referral",
  "referred_by_user_id": null,
  "subscription_balance": 50.0,
  "subscription_expiry": "2025-01-01T00:00:00+00:00",
  "subscription_plan": {
    "id": 1,
    "name": "Pro Plan",
    "description": "Standard Professional Plan",
    "plan_type": "recurring",
    "price": 10.0,
    "original_price": 15.0,
    "daily_balance": 50,
    "monthly_spend_limit": 500.0,
    "weekly_limit": 300,
    "initial_balance": 10,
    "is_team_plan": false,
    "team_membership_days": 30,
    "stock": -1,
    "is_renewable": true,
    "provider_url": "",
    "provider_api_key": "",
    "subscription_provider_id": 1,
    "provider_group": "standard",
    "opus_usage_limit_percentage": 100,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000000+00:00",
    "updated_at": "2024-06-01T00:00:00.000000+00:00"
  },
  "subscription_plan_id": 1,
  "team_membership": {
    "current_week_spend": 10.0,
    "daily_subscription_spending": 0,
    "expires_at": "2025-01-01T00:00:00+00:00",
    "last_week_reset": "2024-05-27T00:00:00.000000+00:00",
    "team_api_key": "team_sk_xxxxxxxxxxxx",
    "team_name": "My Dev Team"
  },
  "theme_preference": "dark",
  "tickets_enabled": true,
  "total_referral_earnings": 0,
  "updated_at": "2024-06-01T00:00:00.000000+00:00",
  "username": "example_user"
}
```

---

## 2. Provider Management [DEPRECATED]

**Note**: Provider switching and custom provider selection features are currently deprecated. The following APIs are listed for legacy reference only and should not be actively used.

### Get Available Providers [DEPRECATED]
- **Method**: `GET`
- **Endpoint**: `/api/v1/user/available-providers`

### Get User Provider Alternatives [DEPRECATED]
- **Method**: `GET`
- **Endpoint**: `/api/v1/user/provider-alternatives/{providerId}`

### Get Current User Selection [DEPRECATED]
- **Method**: `GET`
- **Endpoint**: `/api/v1/user/provider-alternatives/{providerId}/selection`

### Get Team Provider Alternatives [DEPRECATED]
- **Method**: `GET`
- **Endpoint**: `/api/v1/user/team-provider-alternatives/{providerType}`

### Get Current Team Selection [DEPRECATED]
- **Method**: `GET`
- **Endpoint**: `/api/v1/user/team-provider-alternatives/{providerType}/selection`
