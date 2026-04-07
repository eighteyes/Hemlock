/**
 * defaults.js — Preset blocklist buckets
 * Responsibilities:
 *   - Define default bucket categories with initial entries
 *   - Provide a factory function that returns a fresh copy of defaults
 */

const Defaults = (() => {
  function entry(name, enabled = true) {
    return { name, enabled };
  }

  function getDefaults() {
    return [
      {
        id: 'politicians',
        name: 'Politicians',
        enabled: true,
        preset: true,
        entries: [
          entry('Trump'),
          entry('Vance'),
          entry('Marjorie Taylor Greene'),
          entry('Gaetz'),
          entry('Ted Cruz'),
          entry('Kash Patel'),
          entry('Hegseth'),
          entry('Mike Johnson'),
          entry('Stephen Miller'),
          entry('RFK'),
          entry('Robert F. Kennedy'),
          entry('DeSantis'),
          entry('Newsom'),
          entry('McConnell'),
          entry('Pelosi'),
          entry('Schumer'),
          entry('AOC'),
          entry('MAGA'),
          entry('Boebert'),
          entry('Hawley'),
          entry('Jim Jordan'),
          entry('Rubio'),
          entry('Putin'),
          entry('Netanyahu'),
          entry('Bolsonaro'),
          entry('Milei'),
          entry('Orbán'),
          entry('Duterte'),
          entry('Erdogan'),
          entry('Modi'),
          entry('Xi Jinping')
        ]
      },
      {
        id: 'tech-bros',
        name: 'Tech Bros',
        enabled: true,
        preset: true,
        entries: [
          entry('Musk'),
          entry('Zuckerberg'),
          entry('Altman'),
          entry('Jensen Huang'),
          entry('Pichai'),
          entry('Nadella'),
          entry('Amodei'),
          entry('Thiel'),
          entry('Tim Cook'),
          entry('Andreessen'),
          entry('Jack Dorsey'),
          entry('Ramaswamy'),
          entry('Garry Tan'),
          entry('Yarvin'),
          entry('Balaji'),
          entry('David Sacks'),
          entry('Chamath'),
          entry('Calacanis'),
          entry('Palmer Luckey'),
          entry('Joe Lonsdale'),
          entry('Alex Karp')
        ]
      },
      {
        id: 'billionaires',
        name: 'Billionaires',
        enabled: true,
        preset: true,
        entries: [
          entry('Bezos'),
          entry('Bill Gates'),
          entry('Ellison'),
          entry('Arnault'),
          entry('Murdoch')
        ]
      },
      {
        id: 'companies',
        name: 'Companies',
        enabled: true,
        preset: true,
        entries: [
          entry('OpenAI'),
          entry('Tesla', false),
          entry('SpaceX'),
          entry('Palantir'),
          entry('Oracle', false),
          entry('Nvidia'),
          entry('Apple', false),
          entry('Meta', false),
          entry('Amazon', false),
          entry('Microsoft'),
          entry('Anthropic'),
          entry('TikTok'),
          entry('xAI')
        ]
      },
      {
        id: 'celebrities',
        name: 'Celebrities',
        enabled: true,
        preset: true,
        entries: [
          entry('Kardashian'),
          entry('Kanye'),
          entry('Jake Paul'),
          entry('Logan Paul'),
          entry('Taylor Swift'),
          entry('Rogan'),
          entry('Carlson'),
          entry('Shapiro'),
          entry('MrBeast'),
          entry('Andrew Tate'),
          entry('Alex Jones')
        ]
      }
    ];
  }

  return { getDefaults };
})();

if (typeof module !== 'undefined') module.exports = Defaults;
