Documentation for the release process of DesThree:

- [ ] Run tests
- [ ] Make a new release branch named `prepare-X.Y.Z`
- [ ] Bump version number in `package.json`
- [ ] Run `npm run build` to rebuild the userscript into `dist/DesThree.user.js` with the new version number and changes. Use this userscript to:
  - [ ] Run & Migrate all tests and README examples to the new version number
    - for tests, `s=[]`, `s.push(Calc.getState())`, and `copy(s.map(e => JSON.stringify(e)).join(',\n\t'))` may be helpful
- [ ] Update [the changelog](https://github.com/jared-hughes/DesThree/blob/master/docs/CHANGELOG.md) with migration directions and other changes based on commits
- [ ] If it looks like everything is good, merge the branch into `master`
- [ ] Make a new release on [DesThree's Github release page](https://github.com/jared-hughes/DesThree/releases) with the most important parts of the changelog.
