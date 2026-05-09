# Mud Buddy Quiet Beta Plan

## Goal

Prove that a normal EBMUD customer can use Mud Buddy without Dan explaining it live:

1. get or understand how to get the EBMUD usage file without feeling technical;
2. upload it safely in the browser;
3. understand the report;
4. know what to check next;
5. understand when to use EBMUD directly.

## Who to ask

Start with 3-5 trusted East Bay people before broad social launch.

Good testers:

- EBMUD customers with a recent high bill;
- homeowners or renters with irrigation;
- gardeners or people changing landscaping;
- busy parents or households with changing occupancy;
- one non-technical person who will be honest if the usage-file step is confusing.

Avoid asking for public screenshots or raw usage files. Testers should use the live site directly.

## Tester ask

Copy/paste:

```text
I built a small browser-local tool called Mud Buddy for EBMUD customers.

Could you try it for 5-10 minutes?

1. Open https://danieloleary.github.io/mud-buddy/
2. Click Try sample report first.
3. If you are comfortable, download your own EBMUD usage file and upload it.
4. Tell me where you got stuck, what the report made clear, and what still felt confusing.

Privacy note: the usage file is read in your browser and is not uploaded to a Mud Buddy server. Please do not send me your raw usage file unless you explicitly want private help debugging it.
```

## Questions to ask after

- What did you think Mud Buddy does before clicking anything?
- Did the privacy promise feel clear and believable?
- Could you find how to get the EBMUD usage file?
- Did the report tell you what changed?
- Did the report tell you what to check first?
- Did anything sound too official, too diagnostic, or too technical?
- What would stop you from recommending this to a neighbor?

## What to fix during beta

Fix only launch-blocking issues:

- broken upload/sample flow;
- unclear usage-file instructions;
- mobile layout problems;
- confusing or scary privacy copy;
- report language that sounds like a diagnosis;
- wrong official EBMUD routing;
- false parser failures on real EBMUD exports.

Do not add major new features during quiet beta.

## Success criteria

- 3 testers can run sample data without help.
- 2 testers can understand how to get their EBMUD usage file.
- At least 1 real non-Dan usage file works through the live browser app.
- No tester thinks Mud Buddy asks for an EBMUD login secret.
- No tester thinks Mud Buddy is official EBMUD analysis.
- The report produces at least one useful next check for a real household.

## Capture feedback

Use GitHub issues or a simple notes file. Tag each note as:

- `usage-file-download`;
- `upload`;
- `report-language`;
- `mobile`;
- `privacy`;
- `official-ebmud-routing`;
- `future-feature`.

