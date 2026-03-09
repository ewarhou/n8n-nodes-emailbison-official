# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-09

### 🐛 Bug Fixes

- **Leads → Get Many** - Fixed "Return All" to paginate through all pages using the `page` query parameter instead of stopping at the first page
- **Replies → Get Many** - Fixed "Return All" to paginate through all pages using the `page` query parameter instead of stopping at the first page

## [1.1.3] - 2026-03-02

### 🐛 Bug Fixes

- **Invite Members** - Fixed role options to match API. Replaced invalid `member` role with correct enum values: `admin`, `editor`, `client`, `reseller`
- Updated fallback default role from `member` to `admin` in execution logic

## [1.0.0] - 2025-01-12

### 🎉 Initial Release

First stable release of the EmailBison n8n community node!

### ✨ Features

#### **Leads Management**
- **Create Lead** - Create new leads with email, name, company, and custom fields
- **Get Lead** - Retrieve single lead by ID with dropdown selector
- **Get Many Leads** - List leads with pagination (max 15 items per API limitation)
- **Update Lead** - Update lead information (first_name, last_name, company, phone, email, custom_fields)

#### **Campaigns**
- **Create Campaign** - Create email campaigns with name and sender emails
- **Get Campaign** - Retrieve campaign details with dropdown selector
- **Get Many Campaigns** - List all campaigns
- **Update Campaign** - Update campaign name and sender emails
- **Add Leads to Campaign** - Bulk add leads to campaigns (processes all input items)
- **Start/Resume Campaign** - Start or resume paused campaigns
- **Stop/Pause Campaign** - Pause running campaigns

#### **Tags**
- **Create Tag** - Create new tags for lead organization
- **Get Many Tags** - List all tags (used in dropdowns)
- **Delete Tag** - Remove tags

#### **Email Accounts**
- **Create Email Account** - Add sender email accounts with SMTP/IMAP configuration
- **Get Email Account** - Retrieve single email account details
- **Get Many Email Accounts** - List all email accounts
- **Update Email Account** - Update email account settings (name, daily_limit, etc.)
- **Delete Email Account** - Remove email accounts

#### **Replies**
- **Compose New Email** - Send one-off emails outside of campaigns
  - Supports: to_emails, cc_emails, bcc_emails, subject, message, content_type
  - No lead_id required
  - Uses empty arrays `[]` for optional fields (not `null`)
- **Get Many Replies** - Retrieve email replies with filters
  - Filter by: campaign_id, lead_id, status (unread/read/interested/not_interested)
  - Returns full reply metadata including timestamps, sender/recipient info

#### **Sequence Steps**
- **Delete Sequence Step** - Remove steps from campaign sequences

### 🔧 Technical Details

- **Dynamic Server URL Support** - Configure custom EmailBison instance URLs
- **Credential Management** - Secure API token authentication
- **Resource Dropdowns** - Dynamic dropdowns for campaigns, leads, tags, email accounts
- **Bulk Operations** - "Execute Once" mode for processing multiple items
- **Error Handling** - Comprehensive error messages for API failures

### 📝 Known Limitations

1. **Pagination** - Get Many Leads returns maximum 15 items (API limitation)
2. **Get Tag (Single)** - Returns 403 Forbidden (API authorization bug)
3. **Delete Campaign** - Not supported by EmailBison API
4. **Update Lead Response** - API doesn't return all updated fields (phone, email, custom_fields)
5. **Sequence Steps Get Many** - Endpoint returns "Record not found" (API routing bug)

### 🚀 Deferred to v1.1

- **Send Test Email** (Sequence Steps) - Code complete, needs testing
- **Webhooks** (Full CRUD) - Real-time automation triggers
- **Attach Tags to Lead** - Bulk tag operations
- **Update Tag** - Rename tags

### 🐛 Bug Fixes

- Fixed "Compose New Email" to use empty arrays `[]` instead of `null` for optional fields
- Fixed campaign creation UI validation
- Fixed lead selector ordering in Update Lead operation
- Fixed "Attach Tags to Leads" duplicate operation (removed from Leads resource)

### 📚 Documentation

- Comprehensive V1_RELEASE_CHECKLIST.md with all tested operations
- Detailed API endpoint documentation
- Known issues and workarounds documented

---

## [Unreleased]

### Planned for v1.1.0
- Send Test Email for sequence steps
- Webhooks (Create, Get, Get Many, Update, Delete)
- Attach Tags to Lead operation
- Update Tag operation

---

**Full Changelog**: https://github.com/bcharleson/emailbison/commits/v1.0.0

