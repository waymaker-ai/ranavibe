# CoFounder Project Governance

This document describes the governance model for the CoFounder project.

---

## Maintainers

The following individuals are the current project maintainers with full commit access and decision-making authority:

- **Ashley Kays** -- Co-maintainer ([@ashleykays](https://github.com/ashleykays))
- **Christian Moore** -- Co-maintainer, Waymaker AI ([@christianmoore](https://github.com/christianmoore))

Maintainers are responsible for:
- Reviewing and merging pull requests
- Triaging issues
- Making architectural decisions
- Managing releases
- Enforcing the Code of Conduct

---

## Decision Making

### Day-to-Day Decisions

Day-to-day decisions (bug fixes, minor improvements, documentation updates) are made by any maintainer through the normal pull request review process. A single maintainer approval is sufficient for routine changes.

### Significant Decisions

For significant changes (new packages, breaking API changes, major architectural shifts, governance changes), the process is:

1. **Proposal** -- Open a GitHub Discussion or Issue describing the change, its motivation, and alternatives considered.
2. **Discussion** -- Allow at least 7 days for community feedback.
3. **Consensus** -- Both maintainers must agree before proceeding. If consensus cannot be reached, the proposal is tabled for further discussion.
4. **Implementation** -- Once approved, the change follows the normal PR process.

### RFC Process

Major features or breaking changes should follow a lightweight RFC (Request for Comments) process:

1. Open a GitHub Discussion with the `rfc` label.
2. Describe the problem, proposed solution, and alternatives.
3. Gather community feedback for at least 7 days.
4. Maintainers make a final decision based on community input and project goals.

---

## Contributors

Anyone can contribute to CoFounder. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Becoming a Contributor

1. Start by fixing bugs, improving documentation, or adding tests.
2. Submit pull requests following the contribution guidelines.
3. Participate in discussions and help other users.
4. Consistent, quality contributions over time build trust.

### Becoming a Maintainer

Maintainer status is granted by existing maintainers to contributors who demonstrate:

- **Sustained contribution** -- Regular, quality contributions over at least 3 months.
- **Technical judgment** -- Understanding of the project architecture and design principles.
- **Community trust** -- Constructive participation in discussions and code reviews.
- **Alignment** -- Agreement with the project's mission and design principles.

The process:
1. An existing maintainer nominates the contributor.
2. All current maintainers must agree.
3. The new maintainer is added to the GOVERNANCE.md file and granted repository access.

---

## Release Process

CoFounder follows semantic versioning (semver) for all published packages.

### Release Steps

1. **Prepare** -- Ensure all tests pass on the `main` branch.
2. **Changelog** -- Update changelogs for affected packages.
3. **Version bump** -- Use `pnpm` workspace versioning to bump package versions.
4. **Tag** -- Create a git tag for the release (e.g., `v0.2.0`).
5. **Publish** -- Publish affected packages to npm under the `@waymakerai` scope.
6. **GitHub Release** -- Create a GitHub Release with release notes summarizing changes.

### Release Cadence

- **Patch releases** (bug fixes): As needed, typically weekly.
- **Minor releases** (new features, non-breaking): Monthly or as features are ready.
- **Major releases** (breaking changes): As needed, with advance notice and migration guides.

### Pre-release Versions

New features may be published as pre-release versions (`x.y.z-beta.1`) for early testing before a stable release.

---

## Security Vulnerability Handling

Security vulnerabilities are handled with urgency. See [SECURITY.md](./SECURITY.md) for the full security policy.

### Summary

1. **Report** -- Vulnerabilities are reported privately via email to security@waymaker.ai.
2. **Acknowledge** -- The team acknowledges within 24 hours.
3. **Assess** -- Initial assessment within 48 hours.
4. **Fix** -- Critical issues are targeted for resolution within 7 days.
5. **Disclose** -- A security advisory is published after the fix is released.
6. **Credit** -- Reporters are credited unless they prefer anonymity.

Maintainers must not discuss unpatched vulnerabilities in public channels.

---

## Code of Conduct

All participants in the CoFounder project are expected to follow the project's Code of Conduct. Maintainers are responsible for enforcement.

---

## Amendments

This governance document may be amended by consensus of all current maintainers. Proposed changes should be submitted as a pull request and discussed for at least 7 days before merging.
