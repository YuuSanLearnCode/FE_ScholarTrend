const fs = require('fs');
const path = require('path');

const rawBeEndpoints = `
GET /api/admin/dashboard
POST /api/admin/gap-analysis/quality/assess
POST /api/admin/gap-analysis/quality/assess/{topicId}
POST /api/admin/gap-analysis/extract
POST /api/admin/gap-analysis/extract/{topicId}
POST /api/admin/gap-analysis/patterns/mine
POST /api/admin/gap-analysis/patterns/mine/{topicId}
POST /api/admin/gap-analysis/gaps/generate
POST /api/admin/gap-analysis/gaps/generate/{topicId}
POST /api/admin/gap-analysis/gaps/regenerate/{topicId}
POST /api/admin/gap-analysis/pipeline/{topicId}
POST /api/admin/gap-analysis/extract-paper/{paperId}
GET /api/admin/gap-analysis/test-ai
POST /api/admin/migrations/pdfs/local-to-b2
GET /api/admin/migrations/pdfs
POST /api/admin/pdf-text/papers/{researchPaperId}/extract
POST /api/admin/pdf-text/papers/extract-batch
POST /api/admin/pdf-text/backfill
GET /api/admin/pdf-text/papers/{researchPaperId}
GET /api/admin/sync/pending
GET /api/admin/sync/pending/{id}
POST /api/admin/sync/pending/{id}/approve
POST /api/admin/sync/pending/{id}/reject
GET /api/admin/sync/logs
GET /api/admin/sync/data-sources
PATCH /api/admin/sync/data-sources/{id}
GET /api/admin/sync/schedule
PUT /api/admin/sync/schedule
GET /api/admin/sync/status
GET /api/admin/sync/status/{sourceName}
GET /api/admin/sync/schedule/history
POST /api/admin/sync/trigger
GET /api/admin/users
GET /api/admin/users/{id}
PATCH /api/admin/users/{id}/status
PATCH /api/admin/users/{id}/role
POST /api/Auth/register
POST /api/Auth/verify-email
POST /api/Auth/resend-verification
POST /api/Auth/login
POST /api/Auth/google-login
POST /api/Auth/change-password
GET /api/Auth/profile
PUT /api/Auth/profile
POST /api/Auth/refresh-token
POST /api/Auth/forgot-password
POST /api/Auth/reset-password
GET /api/Authors
GET /api/Authors/by-name
GET /api/Authors/{id}
GET /api/Bookmarks
POST /api/Bookmarks/{paperId}
DELETE /api/Bookmarks/{paperId}
GET /api/Dashboard/personal
GET /api/Dashboard/overview
POST /api/Files/upload
POST /api/Files/avatar
GET /api/Files
GET /api/Files/{id}/download
DELETE /api/Files/{id}
GET /api/Follows/topics
GET /api/Follows/journals
POST /api/Follows/topics/{topicId}
DELETE /api/Follows/topics/{topicId}
POST /api/Follows/journals/{journalId}
DELETE /api/Follows/journals/{journalId}
GET /api/Follows/authors
GET /api/Follows/papers
POST /api/Follows/authors/{authorId}
DELETE /api/Follows/authors/{authorId}
POST /api/Follows/papers/{paperId}
DELETE /api/Follows/papers/{paperId}
GET /api/Follows/counts
GET /api/Journals
GET /api/Journals/{id}
GET /api/Notifications
GET /api/Notifications/unread-count
PATCH /api/Notifications/{id}/read
PATCH /api/Notifications/read-all
GET /api/Notifications/settings
PUT /api/Notifications/settings
GET /api/Papers/aggregate
GET /api/Papers/{id}/aggregate
GET /api/Papers/search
GET /api/Papers/{id}
POST /api/Papers/{id}/view
POST /api/Papers/{id}/analyze
GET /api/Papers/by-topic/{topicId}
GET /api/Papers/by-journal/{journalId}
GET /api/Papers/search-history
GET /api/Papers/{id}/pdf
GET /api/Payment/plans
POST /api/Payment/checkout
POST /api/Payment/webhook
GET /api/Payment/history
GET /api/Reports/publications
GET /api/Reports/export/json
GET /api/Reports/export/csv
GET /api/Topics
GET /api/Topics/{id}
GET /api/Topics/{id}/insights/dashboard
GET /api/Topics/{id}/gaps
GET /api/Topics/{id}/gaps/list
GET /api/Topics/gaps/{gapId}
GET /api/Topics/gaps/{gapId}/evidences
GET /api/Topics/{id}/patterns
GET /api/Topics/{id}/trends
GET /api/Topics/{id}/coverage
GET /api/Topics/{id}/quality
GET /api/Topics/{id}/analysis
GET /api/Trends/dashboard
GET /api/Trends/keywords
GET /api/Trends/keywords/top
GET /api/Trends/topics
GET /api/Trends/topics/top
GET /api/Trends/journals
GET /api/Trends/journals/top
GET /api/Trends/publications
POST /api/Trends/compare
`;

const beEndpoints = rawBeEndpoints.split('\n').map(l => l.trim().toLowerCase()).filter(l => l);

function getFEEndpoints() {
    const servicesDir = path.join(__dirname, 'src', 'services');
    const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
    const feEndpoints = [];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf8');
        const regex = /api\.(get|post|put|patch|delete)\(\s*(['\`"])(.*?)\2/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            let method = match[1].toLowerCase();
            let url = match[3].toLowerCase();
            // clean up url
            url = url.replace(/\\/g, '/'); // forward slashes
            url = url.replace(/\$\\{.*?\}/g, '{id}'); // normalize variables
            if (url.startsWith('/')) {
                url = '/api' + url;
            } else {
                url = '/api/' + url;
            }
            feEndpoints.push(method + ' ' + url);
        }
    }
    return feEndpoints;
}

const feEndpoints = getFEEndpoints();

const missing = [];
for (let be of beEndpoints) {
    let normalizedBe = be.replace(/\{[^}]+\}/g, '{id}'); // normalize ALL variables to {id}
    
    // Exact match check
    if (!feEndpoints.includes(normalizedBe)) {
        let found = false;
        for (let fe of feEndpoints) {
            if (fe === normalizedBe || fe.startsWith(normalizedBe + '?') || fe.startsWith(normalizedBe + '/')) {
                found = true;
                break;
            }
        }
        if (!found) {
            missing.push(be);
        }
    }
}

console.log(JSON.stringify(missing, null, 2));
