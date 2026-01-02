# PocketBase.cn Development Roadmap

> **Version:** 1.0.0
> **Last Updated:** 2025-12-30
> **Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Phases](#project-phases)
3. [Milestone Breakdown](#milestone-breakdown)
4. [Sprint Planning](#sprint-planning)
5. [Task Dependencies](#task-dependencies)
6. [Risk Register](#risk-register)
7. [Success Metrics](#success-metrics)
8. [Launch Checklist](#launch-checklist)

---

## Executive Summary

PocketBase.cn is the Chinese community portal for PocketBase, providing:

- **Documentation Site**: Translated official documentation in Chinese
- **Plugin Marketplace**: Community-submitted extensions and plugins
- **Showcase Gallery**: Real-world project showcases from the community
- **Mirror Downloads**: Domestic CDN for faster downloads in China
- **User System**: GitHub OAuth integration for community features

---

## Project Phases

### Phase 1: MVP (Weeks 1-6)

**Focus:** Documentation + Mirror Downloads

Core value proposition delivery - users can access Chinese documentation and download PocketBase binaries quickly from domestic servers.

### Phase 2: Community (Weeks 7-10)

**Focus:** User System + Showcase Gallery

Enable community participation through GitHub OAuth and project showcases.

### Phase 3: Ecosystem (Weeks 11-14)

**Focus:** Plugin Marketplace

Build the plugin submission, review, and discovery system.

### Phase 4: Growth (Weeks 15+)

**Focus:** Automation + Monetization

Scale operations with automated processes and explore sustainable revenue models.

---

## Milestone Breakdown

### M1: Foundation Infrastructure

**Target Date:** Week 2

#### Objectives

Establish the technical foundation for all subsequent features.

#### Features

- [ ] Project scaffolding with Next.js 14+ (App Router)
- [ ] PocketBase backend setup and configuration
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Development, staging, and production environments
- [ ] Domain configuration (pocketbase.cn)

#### Technical Tasks

| Task                                       | Priority | Estimate |
| ------------------------------------------ | -------- | -------- |
| Initialize Next.js project with TypeScript | P0       | 2h       |
| Configure Tailwind CSS + shadcn/ui         | P0       | 2h       |
| Set up PocketBase instance                 | P0       | 4h       |
| Configure Vercel deployment                | P0       | 2h       |
| Set up GitHub Actions workflows            | P0       | 4h       |
| Configure domain DNS and SSL               | P0       | 2h       |
| Set up error monitoring (Sentry)           | P1       | 2h       |
| Configure analytics (Umami/Plausible)      | P1       | 2h       |

#### Acceptance Criteria

- [ ] Homepage accessible at pocketbase.cn
- [ ] Deployment triggers automatically on main branch push
- [ ] PocketBase admin panel accessible and secured
- [ ] SSL certificate valid and auto-renewing
- [ ] Error monitoring capturing exceptions

#### Dependencies

- Domain registration complete
- Vercel/hosting account ready
- GitHub repository created

---

### M2: Documentation System

**Target Date:** Week 4

#### Objectives

Deliver fully translated, searchable Chinese documentation.

#### Features

- [ ] MDX-based documentation rendering
- [ ] Navigation sidebar with nested sections
- [ ] Full-text search (Chinese-optimized)
- [ ] Code syntax highlighting with copy button
- [ ] Version selector for different PocketBase versions
- [ ] Breadcrumb navigation
- [ ] Table of contents (auto-generated)
- [ ] Previous/Next page navigation

#### Technical Tasks

| Task                                    | Priority | Estimate |
| --------------------------------------- | -------- | -------- |
| Set up content layer (Contentlayer/MDX) | P0       | 4h       |
| Create documentation layout components  | P0       | 8h       |
| Implement navigation system             | P0       | 6h       |
| Integrate search (Pagefind/Algolia)     | P0       | 8h       |
| Translate Introduction section          | P0       | 8h       |
| Translate API Reference section         | P0       | 16h      |
| Translate Guides section                | P0       | 12h      |
| Implement code block enhancements       | P1       | 4h       |
| Add version switching logic             | P1       | 6h       |
| SEO optimization (meta, sitemap)        | P1       | 4h       |

#### Acceptance Criteria

- [ ] All official docs translated to Chinese
- [ ] Search returns relevant results within 200ms
- [ ] Mobile-responsive documentation layout
- [ ] Code examples copyable with one click
- [ ] PageSpeed score >= 90

#### Dependencies

- M1: Foundation Infrastructure complete
- Translation team/process established

---

### M3: Mirror Download System

**Target Date:** Week 6

#### Objectives

Provide fast, reliable PocketBase binary downloads for users in China.

#### Features

- [ ] Download page with OS/architecture selection
- [ ] Automatic sync from official releases
- [ ] Download statistics tracking
- [ ] Checksum verification display
- [ ] CDN distribution (Aliyun/Tencent Cloud)
- [ ] Version history listing

#### Technical Tasks

| Task                                   | Priority | Estimate |
| -------------------------------------- | -------- | -------- |
| Design download page UI                | P0       | 4h       |
| Implement OS/arch detection            | P0       | 4h       |
| Set up release sync automation         | P0       | 8h       |
| Configure CDN storage and distribution | P0       | 8h       |
| Implement download counter             | P1       | 4h       |
| Add checksum display and verification  | P1       | 4h       |
| Create release notification system     | P2       | 6h       |

#### Acceptance Criteria

- [ ] Downloads complete within 30 seconds for 50MB file
- [ ] New releases synced within 1 hour of official release
- [ ] All binaries verified with SHA256 checksums
- [ ] Download statistics visible on page
- [ ] Fallback to official download on CDN failure

#### Dependencies

- M1: Foundation Infrastructure complete
- CDN account and budget approved

---

### M4: User Authentication System

**Target Date:** Week 8

#### Objectives

Enable user registration and authentication via GitHub OAuth.

#### Features

- [ ] GitHub OAuth login flow
- [ ] User profile management
- [ ] Avatar and display name customization
- [ ] Account linking and unlinking
- [ ] Session management
- [ ] User roles (user, contributor, admin)

#### Technical Tasks

| Task                                  | Priority | Estimate |
| ------------------------------------- | -------- | -------- |
| Configure PocketBase OAuth2 providers | P0       | 4h       |
| Implement login/logout UI flow        | P0       | 8h       |
| Create user profile page              | P0       | 6h       |
| Implement profile editing             | P1       | 4h       |
| Set up role-based access control      | P0       | 6h       |
| Add session timeout handling          | P1       | 4h       |
| Implement account deletion flow       | P1       | 4h       |

#### Acceptance Criteria

- [ ] Users can sign in with GitHub in under 10 seconds
- [ ] User profile displays GitHub avatar and username
- [ ] Session persists across browser restarts
- [ ] Admin can assign roles via PocketBase admin
- [ ] Account deletion removes all user data

#### Dependencies

- M1: Foundation Infrastructure complete
- GitHub OAuth app registered

---

### M5: Showcase Gallery

**Target Date:** Week 10

#### Objectives

Allow community members to submit and browse project showcases.

#### Features

- [ ] Showcase submission form
- [ ] Project detail pages
- [ ] Category and tag filtering
- [ ] Featured projects section
- [ ] Voting/like system
- [ ] Admin moderation queue
- [ ] Project screenshots gallery

#### Technical Tasks

| Task                                      | Priority | Estimate |
| ----------------------------------------- | -------- | -------- |
| Design showcase card component            | P0       | 4h       |
| Create showcase listing page              | P0       | 6h       |
| Implement submission form with validation | P0       | 8h       |
| Build project detail page                 | P0       | 6h       |
| Add image upload and optimization         | P0       | 8h       |
| Implement filtering and sorting           | P1       | 6h       |
| Create admin moderation interface         | P0       | 8h       |
| Add voting functionality                  | P2       | 4h       |

#### Acceptance Criteria

- [ ] Users can submit showcases with title, description, URL, and screenshots
- [ ] Submissions enter moderation queue before publishing
- [ ] Gallery displays 20+ projects with smooth infinite scroll
- [ ] Filter by category returns results within 500ms
- [ ] Images lazy-load and display in optimized format

#### Dependencies

- M4: User Authentication System complete
- Image storage configured (R2/S3)

---

### M6: Plugin Marketplace

**Target Date:** Week 14

#### Objectives

Create a marketplace for community-developed PocketBase plugins and extensions.

#### Features

- [ ] Plugin submission workflow
- [ ] Plugin detail pages with documentation
- [ ] Version management and changelogs
- [ ] Installation instructions generator
- [ ] GitHub repository integration
- [ ] Download/star counters
- [ ] Search and filtering
- [ ] Admin review system
- [ ] Developer dashboard

#### Technical Tasks

| Task                                | Priority | Estimate |
| ----------------------------------- | -------- | -------- |
| Design plugin schema and data model | P0       | 4h       |
| Create plugin submission wizard     | P0       | 12h      |
| Build plugin listing page           | P0       | 8h       |
| Implement plugin detail page        | P0       | 8h       |
| Add GitHub repo metadata fetching   | P1       | 6h       |
| Create version management system    | P0       | 8h       |
| Implement search with filters       | P0       | 8h       |
| Build admin review interface        | P0       | 8h       |
| Create developer dashboard          | P1       | 12h      |
| Add installation code generator     | P1       | 6h       |

#### Acceptance Criteria

- [ ] Developers can submit plugins with README, version, and compatibility info
- [ ] Plugins display GitHub stars and last update date
- [ ] Search returns relevant plugins with typo tolerance
- [ ] Admin can approve, reject, or request changes
- [ ] Version history accessible for each plugin

#### Dependencies

- M4: User Authentication System complete
- M5: Showcase Gallery patterns established

---

### M7: Automation and Scaling

**Target Date:** Week 16+

#### Objectives

Automate operations and prepare for growth.

#### Features

- [ ] Automated translation pipeline
- [ ] Release monitoring and sync
- [ ] Community contribution workflow
- [ ] Email notification system
- [ ] API rate limiting
- [ ] CDN cache optimization
- [ ] Database backup automation

#### Technical Tasks

| Task                                   | Priority | Estimate |
| -------------------------------------- | -------- | -------- |
| Set up translation memory system       | P1       | 16h      |
| Implement GitHub release webhooks      | P0       | 8h       |
| Create contribution guidelines system  | P1       | 8h       |
| Configure transactional email (Resend) | P1       | 6h       |
| Implement API rate limiting            | P0       | 4h       |
| Optimize CDN caching rules             | P1       | 4h       |
| Set up automated backups               | P0       | 4h       |

#### Acceptance Criteria

- [ ] New PocketBase releases synced automatically
- [ ] Contributors receive automated email notifications
- [ ] API handles 1000 requests/minute without degradation
- [ ] Daily backups retained for 30 days
- [ ] CDN cache hit rate > 90%

#### Dependencies

- All previous milestones complete

---

## Sprint Planning

### Week 1-2: Foundation Infrastructure

**Sprint Goal:** Establish development environment and deploy skeleton application.

| Day  | Tasks                                                       |
| ---- | ----------------------------------------------------------- |
| 1    | Initialize Next.js project, configure TypeScript and ESLint |
| 2    | Set up Tailwind CSS, shadcn/ui, and design tokens           |
| 3    | Deploy PocketBase instance, configure collections           |
| 4    | Set up Vercel project, configure environment variables      |
| 5    | Configure GitHub Actions for CI/CD                          |
| 6-7  | Domain setup, SSL, monitoring, and analytics                |
| 8    | Buffer and testing                                          |
| 9-10 | Documentation and handoff preparation                       |

**Deliverables:**

- Deployed skeleton site at pocketbase.cn
- PocketBase admin accessible
- CI/CD pipeline functional

---

### Week 3-4: Documentation System

**Sprint Goal:** Launch Chinese documentation with search functionality.

| Day | Tasks                                                |
| --- | ---------------------------------------------------- |
| 1-2 | Set up MDX content layer and documentation structure |
| 3-4 | Build navigation components and layout               |
| 5-6 | Implement search integration                         |
| 7-8 | Translate core documentation sections                |
| 9   | SEO optimization and meta tags                       |
| 10  | Testing and polish                                   |

**Deliverables:**

- Fully translated documentation
- Working search functionality
- Mobile-responsive layout

---

### Week 5-6: Mirror Download System

**Sprint Goal:** Enable fast domestic downloads of PocketBase binaries.

| Day | Tasks                                 |
| --- | ------------------------------------- |
| 1-2 | Design and implement download page UI |
| 3-4 | Set up CDN and storage configuration  |
| 5-6 | Implement release sync automation     |
| 7-8 | Add download tracking and statistics  |
| 9   | Checksum verification and security    |
| 10  | Load testing and optimization         |

**Deliverables:**

- Download page with OS detection
- CDN-accelerated downloads
- Automated release syncing

---

### Week 7-8: User Authentication System

**Sprint Goal:** Enable GitHub OAuth authentication for community features.

| Day | Tasks                                   |
| --- | --------------------------------------- |
| 1-2 | Configure OAuth providers in PocketBase |
| 3-4 | Build login/logout UI components        |
| 5-6 | Create user profile pages               |
| 7-8 | Implement role-based access control     |
| 9   | Session management and security         |
| 10  | Testing and edge cases                  |

**Deliverables:**

- Working GitHub OAuth login
- User profile management
- Role-based permissions

---

### Week 9-10: Showcase Gallery

**Sprint Goal:** Launch community showcase submission and browsing.

| Day | Tasks                                   |
| --- | --------------------------------------- |
| 1-2 | Design showcase components and pages    |
| 3-4 | Build submission form with image upload |
| 5-6 | Implement listing and detail pages      |
| 7-8 | Create admin moderation interface       |
| 9   | Filtering and sorting functionality     |
| 10  | Testing and content seeding             |

**Deliverables:**

- Showcase submission workflow
- Moderation queue for admins
- Public gallery with filtering

---

### Week 11-14: Plugin Marketplace

**Sprint Goal:** Build and launch the plugin discovery and submission system.

| Day   | Tasks                                            |
| ----- | ------------------------------------------------ |
| 1-4   | Design plugin data model and submission workflow |
| 5-8   | Build plugin listing and detail pages            |
| 9-12  | Implement search and filtering                   |
| 13-16 | Create admin review system                       |
| 17-20 | Build developer dashboard                        |

**Deliverables:**

- Plugin submission and review workflow
- Plugin discovery with search
- Developer management tools

---

## Task Dependencies

### Critical Path Diagram

```
                                    CRITICAL PATH
    ================================================================

    [M1: Foundation]
          |
          v
    +-----+-----+
    |           |
    v           v
[M2: Docs]  [M3: Mirror]
    |           |
    +-----+-----+
          |
          v
    [M4: User Auth]
          |
          v
    [M5: Showcase]
          |
          v
    [M6: Plugin Marketplace]
          |
          v
    [M7: Automation]


    DEPENDENCY MATRIX
    =================

    M1 -----> M2 (Docs needs deployment infrastructure)
    M1 -----> M3 (Mirror needs CDN configuration)
    M1 -----> M4 (Auth needs PocketBase setup)
    M4 -----> M5 (Showcase needs user accounts)
    M4 -----> M6 (Plugins need developer accounts)
    M5 -----> M6 (Plugin UI patterns from Showcase)
    M6 -----> M7 (Automation after core features)


    PARALLEL TRACKS
    ===============

    Track A (Content):     M1 -> M2 ---------> Translation updates
                                    \
    Track B (Downloads):   M1 -> M3 --> Sync automation
                                    \
    Track C (Community):   M1 -> M4 -> M5 -> M6 -> M7


    BLOCKING RELATIONSHIPS
    ======================

    [Foundation] --BLOCKS--> [All Features]
         ^
         |
    Domain, Hosting, PocketBase setup must complete first

    [User Auth] --BLOCKS--> [Community Features]
         ^
         |
    Cannot submit showcases or plugins without accounts

    [Showcase] --BLOCKS--> [Plugin Marketplace]
         ^
         |
    UI patterns and submission workflow reused
```

### Dependency Table

| Milestone               | Depends On | Blocks     |
| ----------------------- | ---------- | ---------- |
| M1: Foundation          | None       | M2, M3, M4 |
| M2: Documentation       | M1         | None       |
| M3: Mirror Downloads    | M1         | None       |
| M4: User Authentication | M1         | M5, M6     |
| M5: Showcase Gallery    | M4         | M6         |
| M6: Plugin Marketplace  | M4, M5     | M7         |
| M7: Automation          | M6         | None       |

---

## Risk Register

### Technical Risks

| Risk                                     | Probability | Impact | Mitigation                                                           |
| ---------------------------------------- | ----------- | ------ | -------------------------------------------------------------------- |
| **CDN service disruption**               | Medium      | High   | Multi-CDN fallback strategy; maintain fallback to official downloads |
| **PocketBase version incompatibility**   | Low         | High   | Pin PocketBase version; test upgrades in staging first               |
| **Search performance degradation**       | Medium      | Medium | Implement caching layer; consider Algolia as backup                  |
| **OAuth provider changes**               | Low         | Medium | Abstract OAuth logic; support multiple providers                     |
| **Translation drift from official docs** | High        | Medium | Set up diff monitoring; automate change detection                    |
| **Image storage costs**                  | Medium      | Low    | Implement upload limits; compress images automatically               |

### Operational Risks

| Risk                                | Probability | Impact | Mitigation                                                   |
| ----------------------------------- | ----------- | ------ | ------------------------------------------------------------ |
| **Low community adoption**          | Medium      | High   | Pre-seed with quality content; engage Chinese dev community  |
| **Spam/abuse submissions**          | High        | Medium | Implement moderation queue; add rate limiting                |
| **Copyright/licensing issues**      | Low         | High   | Clear contribution guidelines; require license declaration   |
| **Domain/hosting compliance**       | Medium      | High   | Work with compliant hosting provider; ICP filing if required |
| **Single maintainer risk**          | High        | High   | Document all processes; automate where possible              |
| **Official PocketBase competition** | Low         | Medium | Focus on Chinese-specific value; build community moat        |

### Risk Response Matrix

```
                    HIGH IMPACT
                         |
    [Domain Compliance]  |  [CDN Disruption]
    [Copyright Issues]   |  [Low Adoption]
                         |  [Single Maintainer]
    ---------------------+---------------------
                         |
    [OAuth Changes]      |  [Spam/Abuse]
    [Image Costs]        |  [Translation Drift]
                         |  [Search Performance]
                         |
                    LOW IMPACT

    LOW PROBABILITY <----+----> HIGH PROBABILITY
```

---

## Success Metrics

### Primary KPIs

| Metric                         | Month 1 | Month 3 | Month 6 | Month 12 |
| ------------------------------ | ------- | ------- | ------- | -------- |
| **Daily Active Users (DAU)**   | 50      | 200     | 500     | 1,000    |
| **Monthly Active Users (MAU)** | 500     | 2,000   | 5,000   | 10,000   |
| **Registered Users**           | 100     | 500     | 2,000   | 5,000    |
| **Daily Downloads**            | 20      | 100     | 300     | 500      |

### Content Metrics

| Metric                         | Target                   | Measurement          |
| ------------------------------ | ------------------------ | -------------------- |
| **Documentation Completeness** | 100% of official docs    | Automated diff check |
| **Translation Freshness**      | < 7 days behind official | Release monitoring   |
| **Showcase Projects**          | 50 by Month 6            | Database count       |
| **Published Plugins**          | 20 by Month 6            | Database count       |

### Engagement Metrics

| Metric                    | Target      | Measurement |
| ------------------------- | ----------- | ----------- |
| **Avg. Session Duration** | > 3 minutes | Analytics   |
| **Pages per Session**     | > 4 pages   | Analytics   |
| **Return Visitor Rate**   | > 30%       | Analytics   |
| **Bounce Rate**           | < 50%       | Analytics   |

### SEO Metrics

| Metric                           | Target                | Measurement    |
| -------------------------------- | --------------------- | -------------- |
| **"PocketBase" ranking (Baidu)** | Top 10                | Weekly check   |
| **"PocketBase 中文" ranking**    | Top 3                 | Weekly check   |
| **Indexed Pages**                | 100% of public pages  | Search Console |
| **Backlinks**                    | 50+ quality backlinks | Ahrefs/SEMrush |

### Technical Metrics

| Metric                | Target      | Measurement    |
| --------------------- | ----------- | -------------- |
| **Page Load Time**    | < 2 seconds | Lighthouse     |
| **Core Web Vitals**   | All green   | Search Console |
| **Uptime**            | 99.9%       | Monitoring     |
| **API Response Time** | < 200ms p95 | APM            |

---

## Launch Checklist

### Pre-Launch (T-7 Days)

#### Infrastructure

- [ ] Production environment fully configured
- [ ] SSL certificates valid and auto-renewing
- [ ] CDN configured and tested from multiple regions
- [ ] Database backups verified and restorable
- [ ] Error monitoring capturing all exceptions
- [ ] Analytics tracking all key events

#### Security

- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting enabled on all endpoints
- [ ] OAuth tokens properly secured
- [ ] Admin access restricted by IP/2FA
- [ ] Vulnerability scan completed (no critical issues)
- [ ] GDPR/privacy compliance verified

#### Content

- [ ] All documentation translated and reviewed
- [ ] Homepage content finalized
- [ ] Legal pages ready (Terms, Privacy, etc.)
- [ ] 404 and error pages designed
- [ ] Initial showcase projects seeded
- [ ] Placeholder content removed

#### SEO

- [ ] Meta titles and descriptions set
- [ ] Open Graph images generated
- [ ] Sitemap generated and valid
- [ ] Robots.txt configured
- [ ] Structured data implemented
- [ ] Canonical URLs set correctly

### Launch Day (T-0)

#### Morning (09:00)

- [ ] Final smoke test on production
- [ ] Verify all OAuth flows working
- [ ] Test download functionality
- [ ] Check search functionality
- [ ] Review error logs for issues

#### Midday (12:00)

- [ ] Update DNS to point to production
- [ ] Verify SSL certificate active
- [ ] Test from multiple networks/devices
- [ ] Submit sitemap to Baidu/Google
- [ ] Monitor for initial errors

#### Afternoon (15:00)

- [ ] Post announcement on social media
- [ ] Share in relevant Chinese developer communities
- [ ] Monitor traffic and performance
- [ ] Address any user-reported issues

#### Evening (18:00)

- [ ] Review Day 1 analytics
- [ ] Check error rates and performance
- [ ] Respond to community feedback
- [ ] Document any issues for follow-up

### Post-Launch (T+7 Days)

#### Week 1 Review

- [ ] Analyze traffic patterns and sources
- [ ] Review user feedback and feature requests
- [ ] Fix any critical bugs discovered
- [ ] Optimize slow-performing pages
- [ ] Engage with early community members

#### Ongoing

- [ ] Weekly analytics review
- [ ] Monthly performance audit
- [ ] Quarterly security review
- [ ] Regular content updates

---

## Go-Live Flow

```
    T-7 DAYS                    T-0                      T+7 DAYS
    ========                    ===                      ========

    [Pre-Launch Checklist]      [Launch Day]             [Post-Launch]
           |                         |                        |
           v                         v                        v
    +--------------+          +--------------+          +--------------+
    | Final QA     |          | DNS Switch   |          | Analytics    |
    | Security Scan|   ---->  | Smoke Test   |   ---->  | Review       |
    | Content Lock |          | Announce     |          | Bug Fixes    |
    +--------------+          +--------------+          +--------------+
           |                         |                        |
           v                         v                        v
    Sign-off from            Monitor metrics            Iterate based
    all stakeholders         and errors                 on feedback


    ROLLBACK PROCEDURE
    ==================

    If critical issues discovered:

    1. [Detect Issue] --> [Assess Severity] --> [Critical?]
                                                    |
                         +------------+-------------+
                         |                          |
                         v                          v
                    [Yes: Rollback]           [No: Hotfix]
                         |                          |
                         v                          v
                    Revert DNS to             Deploy fix to
                    maintenance page          production
                         |                          |
                         v                          v
                    Investigate and           Monitor for
                    fix in staging            resolution
```

---

## Appendix

### Technology Stack Summary

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Frontend   | Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui |
| Backend    | PocketBase                                       |
| Database   | SQLite (PocketBase)                              |
| Hosting    | Vercel (Frontend), Railway/Fly.io (PocketBase)   |
| CDN        | Aliyun OSS + CDN / Tencent Cloud COS + CDN       |
| Search     | Pagefind / Algolia                               |
| Analytics  | Umami / Plausible                                |
| Monitoring | Sentry                                           |
| CI/CD      | GitHub Actions                                   |

### Team Requirements

| Role                 | Phase 1-2     | Phase 3-4     |
| -------------------- | ------------- | ------------- |
| Full-stack Developer | 1             | 1-2           |
| Translator           | 1 (part-time) | 1 (part-time) |
| Community Manager    | 0             | 1 (part-time) |
| Designer             | 0.5           | 0.5           |

### Budget Estimates (Monthly)

| Item               | Phase 1-2  | Phase 3-4   |
| ------------------ | ---------- | ----------- |
| Hosting (Vercel)   | $0-20      | $20-50      |
| PocketBase Hosting | $5-10      | $10-25      |
| CDN + Storage      | $10-30     | $30-100     |
| Domain             | $1         | $1          |
| Monitoring/Tools   | $0-20      | $20-50      |
| **Total**          | **$16-81** | **$81-226** |

---

_This roadmap is a living document and will be updated as the project evolves._
