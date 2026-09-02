# payrollgivingscheme.co.uk

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

- **`/`** - the holding page. This is what goes live now. Its primary call to action is
  "Support the fundraise", pointing at https://raise.payrollgivingscheme.com/.
- **`/claude-test/`** - the full site build, parked here while the real thing is worked on.

## Structure

```
index.html              Holding page
css/holding.css         Holding page styles (self-contained)
js/holding.js           Dot animation and footer year - that is all

claude-test/index.html  Full site
claude-test/css/styles.css
claude-test/js/main.js

assets/                 Shared by both pages
docs/                   Brand brief, and a Google Sheet sign-up guide (not currently wired up)
```

Both pages read the logo from `assets/`, so it lives in one place. The holding page does
not depend on `claude-test/` in any way - you can delete that folder and the root still works.

## Running it

```bash
python3 -m http.server 8000
```

http://localhost:8000 for the holding page, http://localhost:8000/claude-test/ for the full site.
Any static host works - upload the folder as it is.

## Before the holding page goes live

1. **Watch the waitlist inbox.** The secondary action is a `mailto:` to
   `waitlist@payrollgivingscheme.com`, with the subject prefilled as "Join the waitlist" so it
   filters easily. There is no database behind it - somebody has to read that mailbox and keep
   the list. `docs/google-sheet-signups.md` is kept for when you want a real form instead.
2. **Fill the footer placeholders.** Registration status and charity number are marked
   `[ insert once confirmed ]` and `[ pending ]`.
3. **Add an OG image.** 1200x630 at `assets/og.png`, then add `<meta property="og:image">`.
   Without it, links shared on social have no preview image.
4. **Decide whether `/claude-test/` should be public.** It is a normal folder, so it will be
   served by any static host. Block it with a `robots.txt` disallow, an `X-Robots-Tag`, or by
   simply not deploying that folder.

## Design system

Follows `docs/Payroll-Giving-Scheme-Brand-Brief.docx`, with the palette and component treatment
matched to the live campaign page at raise.payrollgivingscheme.com.

| Token | Value | Used for |
| --- | --- | --- |
| `--paper` | `#f6f3eb` | Main canvas |
| `--paper-2` | `#f9f7f0` | Alternate bands |
| `--ink` | `#0f1f35` | Type, dark sections, primary buttons |
| `--mint` | `#36bfa3` | Accent: dots, bars, ticks |
| `--mint-text` | `#17705d` | The accent at body-copy size, so it still meets AA |
| `--slate` | `#566273` | Secondary copy |
| `--rule` | `#e0e5ea` | Borders and dividers |

Inter throughout. Pill buttons. 1px borders rather than shadows. 8px spacing scale.

The hero device on both pages is the approved one: 40 dots arrive in a fixed shuffled order
over about three seconds to form a single circle. `prefers-reduced-motion` shows the completed
circle immediately.

## The full site, at /claude-test/

Sections: hero, the 97/23/60%+ stat strip, the Direct Debit vs Payroll Giving comparison,
the gap, how it works, a product preview, the £5,000 fundraise with founding tiers, the £1m
first goal, FAQs, register your interest.

Interactive: a 20/40/45% tax-rate control on the comparison, ARIA tabs on the product preview,
a progress bar driven by `data-raised` / `data-goal`, a Business/Individual toggle that swaps
tier content without shifting the layout, an accordion FAQ, and a validated form.

Still to do there: wire the form, point the Donate and tier CTAs at a real payment flow
(they all anchor to `#register`), update `data-raised`, and cite the three statistics -
they are carried over from the campaign page and have no source on the page.

## Claim accuracy

The comparison follows the campaign page: a £10 gift of gross pay against a Direct Debit,
where £4 of a 40% taxpayer's £10 goes to HMRC. Two qualifiers sit in the footnote - the planned
3% agency fee, and the fact that a Direct Debit donation may also qualify for Gift Aid, with
higher-rate relief on it normally claimed by the donor through Self Assessment. The brief asks
for exactly that nuance, so please keep it if the copy is edited.

## Logo

`assets/logo.png` is the supplied artwork. `pg-lockup.png` and `pg-monogram.png` are cropped and
downscaled from it. If you have the original vector, drop in `pg-lockup.svg` and change the
`<img src>` values - three of them, one in `index.html` and two in `claude-test/index.html`.
