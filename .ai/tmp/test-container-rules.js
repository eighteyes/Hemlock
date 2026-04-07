/**
 * test-container-rules.js — Curl news sites and analyze container patterns
 * Responsibilities:
 *   - Fetch HTML from major news sites via curl
 *   - Analyze DOM container patterns (roles, data-attrs, div depth)
 *   - Report which S+E+R heuristics would fire
 */

const { execSync } = require('child_process');

const SITES = [
  { name: 'CNN',         url: 'https://www.cnn.com/' },
  { name: 'BBC',         url: 'https://www.bbc.com/news' },
  { name: 'Reuters',     url: 'https://www.reuters.com/' },
  { name: 'NPR',         url: 'https://www.npr.org/' },
  { name: 'The Verge',   url: 'https://www.theverge.com/' },
  { name: 'Ars Technica', url: 'https://arstechnica.com/' },
  { name: 'TechCrunch',  url: 'https://techcrunch.com/' },
  { name: 'Reddit',      url: 'https://old.reddit.com/' },
  { name: 'HN',          url: 'https://news.ycombinator.com/' },
  { name: 'NYT',         url: 'https://www.nytimes.com/' },
  { name: 'Fox News',    url: 'https://www.foxnews.com/' },
  { name: 'Google News', url: 'https://news.google.com/' },
];

// Patterns to search for in raw HTML (no DOM parser needed)
const ROLE_PATTERNS = [
  /role="article"/gi,
  /role="listitem"/gi,
  /role="feed"/gi,
  /itemtype="[^"]*Article[^"]*"/gi,
  /itemtype="[^"]*NewsArticle[^"]*"/gi,
  /itemtype="[^"]*BlogPosting[^"]*"/gi,
];

const DATA_ATTR_PATTERNS = [
  /data-\w*(?:story|card|post|feed.?item|article|result)\w*="[^"]*"/gi,
  /data-testid="[^"]*(?:story|card|post|article|result)[^"]*"/gi,
  /data-type="[^"]*(?:story|card|post|article)[^"]*"/gi,
];

const SEMANTIC_TAGS = [
  /<article[\s>]/gi,
  /<section[\s>]/gi,
  /<li[\s>]/gi,
];

// Analyze div nesting depth around text content
const DIV_DEPTH_RE = /(<div[^>]*>[\s]*){2,}/gi;

function curlFetch(url) {
  try {
    const html = execSync(
      `curl -sL -m 15 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"`,
      { maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8' }
    );
    return html;
  } catch (e) {
    return null;
  }
}

function countMatches(html, pattern) {
  const matches = html.match(pattern);
  return matches ? matches.length : 0;
}

function analyzeContainerPatterns(html) {
  const results = {};

  // R: Role patterns
  results.roles = {};
  for (const p of ROLE_PATTERNS) {
    p.lastIndex = 0;
    const matches = html.match(p);
    if (matches && matches.length > 0) {
      results.roles[p.source.replace(/\\/g, '').substring(0, 40)] = matches.length;
    }
  }

  // R: Data attribute patterns
  results.dataAttrs = {};
  for (const p of DATA_ATTR_PATTERNS) {
    p.lastIndex = 0;
    const matches = html.match(p);
    if (matches) {
      // Deduplicate and count
      const unique = [...new Set(matches.map(m => m.split('=')[0]))];
      for (const attr of unique) {
        results.dataAttrs[attr] = matches.filter(m => m.startsWith(attr)).length;
      }
    }
  }

  // Semantic tags
  results.semanticTags = {};
  for (const p of SEMANTIC_TAGS) {
    p.lastIndex = 0;
    const tag = p.source.match(/<(\w+)/)[1];
    results.semanticTags[tag] = countMatches(html, p);
  }

  // S: Div nesting depth analysis
  const deepDivs = html.match(DIV_DEPTH_RE);
  results.deepDivChains = deepDivs ? deepDivs.length : 0;

  // Count single-child div wrappers (approximate via regex)
  const singleChildPattern = /<div[^>]*>\s*<div[^>]*>/gi;
  results.nestedDivPairs = countMatches(html, singleChildPattern);

  // Total divs for context
  results.totalDivs = countMatches(html, /<div[\s>]/gi);

  return results;
}

function printReport(name, analysis) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));

  console.log('\n  R: Role/semantic attributes found:');
  const hasRoles = Object.keys(analysis.roles).length > 0;
  const hasData = Object.keys(analysis.dataAttrs).length > 0;
  if (hasRoles) {
    for (const [k, v] of Object.entries(analysis.roles)) {
      console.log(`    ${k}: ${v}`);
    }
  }
  if (hasData) {
    for (const [k, v] of Object.entries(analysis.dataAttrs)) {
      console.log(`    ${k}: ${v}`);
    }
  }
  if (!hasRoles && !hasData) console.log('    (none)');

  console.log('\n  Semantic tags:');
  for (const [k, v] of Object.entries(analysis.semanticTags)) {
    console.log(`    <${k}>: ${v}`);
  }

  console.log('\n  S: Div nesting:');
  console.log(`    Total <div>s: ${analysis.totalDivs}`);
  console.log(`    Nested div pairs: ${analysis.nestedDivPairs}`);
  console.log(`    Deep div chains (3+): ${analysis.deepDivChains}`);

  // Verdict
  const rScore = hasRoles || hasData ? 'YES' : 'NO';
  const sNeeded = analysis.nestedDivPairs > 10 ? 'YES' : 'MAYBE';
  console.log(`\n  Verdict: R-rules fire: ${rScore} | S-climbing needed: ${sNeeded}`);
}

// Run
console.log('Hemlock Container Pattern Analysis');
console.log('Curling sites and analyzing DOM patterns...\n');

for (const site of SITES) {
  process.stdout.write(`Fetching ${site.name}...`);
  const html = curlFetch(site.url);
  if (!html) {
    console.log(' FAILED (blocked or timeout)');
    continue;
  }
  console.log(` ${(html.length / 1024).toFixed(0)}KB`);
  const analysis = analyzeContainerPatterns(html);
  printReport(site.name, analysis);
}

console.log('\n\nDone. Use findings to tune SITE_OVERRIDES in content-script.js');
