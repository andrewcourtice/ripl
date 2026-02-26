export type Period = '7d' | '2w' | '1m' | '3m' | '6m';

export const PERIODS: { value: Period; label: string }[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '2w', label: 'Last 2 Weeks' },
    { value: '1m', label: 'Last Month' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
];

function periodToDays(period: Period): number {
    switch (period) {
        case '7d': return 7;
        case '2w': return 14;
        case '1m': return 30;
        case '3m': return 90;
        case '6m': return 180;
    }
}

function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function seedFromPeriod(period: Period): number {
    let hash = 0;
    const str = period;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) || 1;
}

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ─── Daily Active Users (Line chart) ────────────────────────────────────────

export interface DailyActiveUsersPoint {
    date: string;
    users: number;
}

export function generateDAUData(period: Period): DailyActiveUsersPoint[] {
    const days = periodToDays(period);
    const rand = seededRandom(seedFromPeriod(period) + 1);
    const data: DailyActiveUsersPoint[] = [];
    const now = new Date();
    const baseUsers = 1200;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOfWeek = date.getDay();
        const weekendDip = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
        const trend = 1 + (days - i) / days * 0.15;
        const noise = 0.9 + rand() * 0.2;
        const users = Math.round(baseUsers * weekendDip * trend * noise);
        data.push({ date: formatDate(date), users });
    }

    return data;
}

// ─── Feature Adoption (Bar chart) ───────────────────────────────────────────

export interface FeatureAdoptionPoint {
    feature: string;
    currentPeriod: number;
    previousPeriod: number;
}

const FEATURES = ['Dashboard', 'Reports', 'Alerts', 'API', 'Integrations', 'Export'];

export function generateFeatureAdoptionData(period: Period): FeatureAdoptionPoint[] {
    const rand = seededRandom(seedFromPeriod(period) + 2);
    const baseCounts = [850, 620, 410, 380, 290, 210];

    return FEATURES.map((feature, i) => {
        const base = baseCounts[i];
        const currentPeriod = Math.round(base * (0.85 + rand() * 0.3));
        const previousPeriod = Math.round(base * (0.7 + rand() * 0.3));
        return { feature, currentPeriod, previousPeriod };
    });
}

// ─── Browser Share (Pie / Donut chart) ──────────────────────────────────────

export interface BrowserSharePoint {
    browser: string;
    share: number;
}

export function generateBrowserShareData(period: Period): BrowserSharePoint[] {
    const rand = seededRandom(seedFromPeriod(period) + 3);
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Other'];
    const baseShares = [58, 20, 10, 8, 4];

    const raw = baseShares.map(s => s + (rand() - 0.5) * 6);
    const total = raw.reduce((a, b) => a + b, 0);

    return browsers.map((browser, i) => ({
        browser,
        share: Math.round(raw[i] / total * 1000) / 10,
    }));
}

// ─── Retention Heatmap ──────────────────────────────────────────────────────

export interface RetentionPoint {
    cohort: string;
    week: string;
    retention: number;
}

export function generateRetentionData(period: Period): {
    data: RetentionPoint[];
    cohorts: string[];
    weeks: string[];
} {
    const rand = seededRandom(seedFromPeriod(period) + 4);
    const numCohorts = Math.min(periodToDays(period) / 7, 8);
    const numWeeks = Math.min(numCohorts, 6);
    const cohorts: string[] = [];
    const weeks: string[] = [];
    const data: RetentionPoint[] = [];

    const now = new Date();

    for (let c = 0; c < numCohorts; c++) {
        const cohortDate = new Date(now);
        cohortDate.setDate(cohortDate.getDate() - (numCohorts - c) * 7);
        const cohortLabel = `Week ${c + 1}`;
        cohorts.push(cohortLabel);
    }

    for (let w = 0; w < numWeeks; w++) {
        weeks.push(`W+${w}`);
    }

    for (const cohort of cohorts) {
        for (let w = 0; w < numWeeks; w++) {
            const baseRetention = w === 0 ? 100 : Math.max(5, 100 * Math.pow(0.65, w));
            const noise = 1 + (rand() - 0.5) * 0.2;
            const retention = Math.round(Math.min(100, baseRetention * noise));
            data.push({ cohort, week: weeks[w], retention });
        }
    }

    return { data, cohorts, weeks };
}

// ─── User Journey Sankey ────────────────────────────────────────────────────

export interface SankeyNodeData {
    id: string;
    label: string;
}

export interface SankeyLinkData {
    source: string;
    target: string;
    value: number;
}

export function generateSankeyData(period: Period): {
    nodes: SankeyNodeData[];
    links: SankeyLinkData[];
} {
    const rand = seededRandom(seedFromPeriod(period) + 5);
    const multiplier = periodToDays(period) / 30;

    const nodes: SankeyNodeData[] = [
        { id: 'landing', label: 'Landing Page' },
        { id: 'signup', label: 'Sign Up' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'docs', label: 'Docs' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'onboarding', label: 'Onboarding' },
        { id: 'active', label: 'Active User' },
        { id: 'churned', label: 'Churned' },
    ];

    const base = (v: number) => Math.round(v * multiplier * (0.85 + rand() * 0.3));

    const links: SankeyLinkData[] = [
        { source: 'landing', target: 'signup', value: base(400) },
        { source: 'landing', target: 'pricing', value: base(300) },
        { source: 'landing', target: 'docs', value: base(200) },
        { source: 'signup', target: 'onboarding', value: base(350) },
        { source: 'signup', target: 'churned', value: base(50) },
        { source: 'pricing', target: 'signup', value: base(180) },
        { source: 'pricing', target: 'churned', value: base(120) },
        { source: 'docs', target: 'signup', value: base(100) },
        { source: 'docs', target: 'churned', value: base(100) },
        { source: 'onboarding', target: 'dashboard', value: base(300) },
        { source: 'onboarding', target: 'churned', value: base(50) },
        { source: 'dashboard', target: 'active', value: base(250) },
        { source: 'dashboard', target: 'churned', value: base(50) },
    ];

    return { nodes, links };
}

// ─── Conversion Funnel ──────────────────────────────────────────────────────

export interface FunnelStagePoint {
    stage: string;
    value: number;
}

export function generateFunnelData(period: Period): FunnelStagePoint[] {
    const rand = seededRandom(seedFromPeriod(period) + 6);
    const multiplier = periodToDays(period) / 30;
    const stages = ['Visited', 'Signed Up', 'Activated', 'Subscribed', 'Renewed'];
    const dropRates = [1, 0.45, 0.65, 0.5, 0.7];

    let current = Math.round(5000 * multiplier * (0.9 + rand() * 0.2));
    return stages.map((stage, i) => {
        if (i > 0) {
            current = Math.round(current * dropRates[i] * (0.9 + rand() * 0.2));
        }
        return { stage, value: current };
    });
}

// ─── Error Rate Gauge ───────────────────────────────────────────────────────

export function generateErrorRate(period: Period): number {
    const rand = seededRandom(seedFromPeriod(period) + 7);
    return Math.round((0.5 + rand() * 4.5) * 100) / 100;
}

// ─── Page Load Scatter ──────────────────────────────────────────────────────

export interface PageLoadPoint {
    page: string;
    loadTime: number;
    views: number;
}

export function generatePageLoadData(period: Period): PageLoadPoint[] {
    const rand = seededRandom(seedFromPeriod(period) + 8);
    const pages = [
        'Home', 'Dashboard', 'Settings', 'Profile', 'Reports',
        'Billing', 'Help', 'API Docs', 'Integrations', 'Export',
        'Analytics', 'Team', 'Notifications', 'Search', 'Admin',
    ];
    const multiplier = periodToDays(period) / 30;

    return pages.map(page => ({
        page,
        loadTime: Math.round((200 + rand() * 2800) * 10) / 10,
        views: Math.round((100 + rand() * 4900) * multiplier),
    }));
}
