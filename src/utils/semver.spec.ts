import { describe, expect, it } from 'vitest';
import { 
  parseSemver, 
  compareSemver, 
  isGreaterThan, 
  isLessThan, 
  isEqual,
  sortVersions,
  maxVersion,
  minVersion,
  isPrerelease,
  isStable,
  shouldRecommendUpgrade,
  getUpgradeType
} from './semver';

describe('semver utilities', () => {
  describe('parseSemver', () => {
    it('should parse basic semver', () => {
      const result = parseSemver('1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: [],
        build: []
      });
    });

    it('should parse semver with prerelease', () => {
      const result = parseSemver('1.2.3-alpha.1');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ['alpha.1'],
        build: []
      });
    });

    it('should parse semver with build metadata', () => {
      const result = parseSemver('1.2.3+build.1');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: [],
        build: ['build.1']
      });
    });

    it('should handle version with v prefix', () => {
      const result = parseSemver('v1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: [],
        build: []
      });
    });

    it('should handle partial versions', () => {
      const result = parseSemver('1.2');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 0,
        prerelease: [],
        build: []
      });
    });
  });

  describe('compareSemver', () => {
    it('should compare major versions correctly', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions correctly', () => {
      expect(compareSemver('1.2.0', '1.1.0')).toBe(1);
      expect(compareSemver('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions correctly', () => {
      expect(compareSemver('1.1.2', '1.1.1')).toBe(1);
      expect(compareSemver('1.1.1', '1.1.2')).toBe(-1);
    });

    it('should handle equal versions', () => {
      expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    });

    it('should handle prerelease versions correctly', () => {
      expect(compareSemver('1.0.0', '1.0.0-alpha')).toBe(1);
      expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(-1);
      expect(compareSemver('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
      expect(compareSemver('1.0.0-beta', '1.0.0-alpha')).toBe(1);
    });

    it('should handle the specific case mentioned', () => {
      expect(compareSemver('11.11.1', '9.9.0')).toBe(1);
      expect(compareSemver('9.9.0', '11.11.1')).toBe(-1);
    });
  });

  describe('isGreaterThan', () => {
    it('should return true when first version is greater', () => {
      expect(isGreaterThan('11.11.1', '9.9.0')).toBe(true);
      expect(isGreaterThan('2.0.0', '1.9.9')).toBe(true);
    });

    it('should return false when first version is not greater', () => {
      expect(isGreaterThan('9.9.0', '11.11.1')).toBe(false);
      expect(isGreaterThan('1.0.0', '1.0.0')).toBe(false);
    });
  });

  describe('isLessThan', () => {
    it('should return true when first version is less', () => {
      expect(isLessThan('9.9.0', '11.11.1')).toBe(true);
      expect(isLessThan('1.0.0', '2.0.0')).toBe(true);
    });

    it('should return false when first version is not less', () => {
      expect(isLessThan('11.11.1', '9.9.0')).toBe(false);
      expect(isLessThan('1.0.0', '1.0.0')).toBe(false);
    });
  });

  describe('isEqual', () => {
    it('should return true for equal versions', () => {
      expect(isEqual('1.2.3', '1.2.3')).toBe(true);
      expect(isEqual('1.2.3-alpha', '1.2.3-alpha')).toBe(true);
    });

    it('should return false for different versions', () => {
      expect(isEqual('1.2.3', '1.2.4')).toBe(false);
      expect(isEqual('1.2.3', '1.2.3-alpha')).toBe(false);
    });
  });

  describe('sortVersions', () => {
    it('should sort versions in ascending order by default', () => {
      const versions = ['1.2.0', '1.10.0', '1.1.0', '2.0.0'];
      const sorted = sortVersions(versions);
      expect(sorted).toEqual(['1.1.0', '1.2.0', '1.10.0', '2.0.0']);
    });

    it('should sort versions in descending order when specified', () => {
      const versions = ['1.2.0', '1.10.0', '1.1.0', '2.0.0'];
      const sorted = sortVersions(versions, true);
      expect(sorted).toEqual(['2.0.0', '1.10.0', '1.2.0', '1.1.0']);
    });

    it('should handle the specific case correctly', () => {
      const versions = ['11.11.1', '9.9.0', '10.0.0'];
      const sorted = sortVersions(versions);
      expect(sorted).toEqual(['9.9.0', '10.0.0', '11.11.1']);
    });
  });

  describe('maxVersion', () => {
    it('should return the greater version', () => {
      expect(maxVersion('11.11.1', '9.9.0')).toBe('11.11.1');
      expect(maxVersion('9.9.0', '11.11.1')).toBe('11.11.1');
      expect(maxVersion('1.0.0', '1.0.0')).toBe('1.0.0');
    });
  });

  describe('minVersion', () => {
    it('should return the lesser version', () => {
      expect(minVersion('11.11.1', '9.9.0')).toBe('9.9.0');
      expect(minVersion('9.9.0', '11.11.1')).toBe('9.9.0');
      expect(minVersion('1.0.0', '1.0.0')).toBe('1.0.0');
    });
  });

  describe('isPrerelease', () => {
    it('should detect prerelease versions', () => {
      expect(isPrerelease('1.6.0-bigip.6')).toBe(true);
      expect(isPrerelease('2.0.0-alpha.1')).toBe(true);
      expect(isPrerelease('1.0.0-beta')).toBe(true);
      expect(isPrerelease('3.1.0-rc.2')).toBe(true);
    });

    it('should not detect stable versions as prerelease', () => {
      expect(isPrerelease('1.6.0')).toBe(false);
      expect(isPrerelease('2.0.0')).toBe(false);
      expect(isPrerelease('10.15.3')).toBe(false);
    });
  });

  describe('isStable', () => {
    it('should detect stable versions', () => {
      expect(isStable('1.6.0')).toBe(true);
      expect(isStable('2.0.0')).toBe(true);
      expect(isStable('10.15.3')).toBe(true);
    });

    it('should not detect prerelease versions as stable', () => {
      expect(isStable('1.6.0-bigip.6')).toBe(false);
      expect(isStable('2.0.0-alpha.1')).toBe(false);
    });
  });

  describe('shouldRecommendUpgrade', () => {
    it('should recommend stable to stable upgrades', () => {
      expect(shouldRecommendUpgrade('1.5.2', '1.6.0')).toBe(true);
      expect(shouldRecommendUpgrade('2.0.0', '3.0.0')).toBe(true);
    });

    it('should not recommend stable to prerelease upgrades', () => {
      expect(shouldRecommendUpgrade('1.5.2', '1.6.0-bigip.6')).toBe(false);
      expect(shouldRecommendUpgrade('2.0.0', '2.1.0-alpha.1')).toBe(false);
    });

    it('should recommend prerelease to stable upgrades', () => {
      expect(shouldRecommendUpgrade('1.6.0-rc.1', '1.6.0')).toBe(true);
      expect(shouldRecommendUpgrade('2.0.0-beta.5', '2.0.0')).toBe(true);
    });

    it('should recommend prerelease to prerelease upgrades', () => {
      expect(shouldRecommendUpgrade('1.6.0-alpha.1', '1.6.0-alpha.2')).toBe(true);
      expect(shouldRecommendUpgrade('2.0.0-beta.1', '2.0.0-beta.2')).toBe(true);
    });

    it('should not recommend downgrades', () => {
      expect(shouldRecommendUpgrade('2.0.0', '1.9.0')).toBe(false);
      expect(shouldRecommendUpgrade('1.6.0', '1.5.2')).toBe(false);
    });
  });

  describe('getUpgradeType', () => {
    it('should detect major upgrades', () => {
      expect(getUpgradeType('1.0.0', '2.0.0')).toBe('major');
      expect(getUpgradeType('2.5.3', '3.0.0')).toBe('major');
    });

    it('should detect minor upgrades', () => {
      expect(getUpgradeType('1.0.0', '1.1.0')).toBe('minor');
      expect(getUpgradeType('2.5.3', '2.6.0')).toBe('minor');
    });

    it('should detect patch upgrades', () => {
      expect(getUpgradeType('1.0.0', '1.0.1')).toBe('patch');
      expect(getUpgradeType('2.5.3', '2.5.4')).toBe('patch');
    });

    it('should detect prerelease upgrades', () => {
      expect(getUpgradeType('1.0.0-alpha.1', '1.0.0-alpha.2')).toBe('prerelease');
      expect(getUpgradeType('2.0.0-beta.1', '2.0.0-beta.2')).toBe('prerelease');
    });

    it('should detect downgrades', () => {
      expect(getUpgradeType('2.0.0', '1.9.0')).toBe('downgrade');
      expect(getUpgradeType('1.6.0', '1.5.2')).toBe('downgrade');
    });

    it('should detect same versions', () => {
      expect(getUpgradeType('1.0.0', '1.0.0')).toBe('same');
      expect(getUpgradeType('2.5.3', '2.5.3')).toBe('same');
    });
  });
});