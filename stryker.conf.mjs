/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  packageManager: 'yarn',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'vitest',
  coverageAnalysis: 'off',
  
  // Mutation settings - minimal working configuration
  mutate: [
    'src/utils/severity.ts'
  ],
  
  // Test file patterns
  testLocation: [
    'tests/**/*.test.ts',
    'tests/**/*.spec.ts'
  ],
  
  // Checkers
  checkers: [],
  tsconfigFile: 'tsconfig.json',
  
  // Mutation score thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Performance settings
  maxConcurrentTestRunners: 4,
  tempDirName: 'tmp',
  cleanTempDir: true,
  
  // Mutation operators to enable
  mutator: {
    plugins: [
      '@stryker-mutator/javascript-mutator'
    ],
    excludedMutations: [
      'StringLiteral', // Often breaks in Vue templates
      'ArrayDeclaration', // Usually not meaningful in Vue
      'ObjectLiteral' // Can break Vue component options
    ]
  },
  
  // Files to ignore completely
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'cypress/**',
    '.stryker-tmp/**',
    'src/assets/**',
    'src/shadcn/**',
    'src/**/*.d.ts',
    'src/**/types.ts',
    'src/**/VulnerabilitySeverities.test.ts',
    'src/**/CreateProject.test.ts'
  ],
  
  // Plugin configurations
  vitest: {
    configFile: 'vitest.config.ts'
  },
  
  // HTML reporter options
  htmlReporter: {
    baseDir: 'reports/mutation'
  },
  
  // JSON reporter for CI integration
  jsonReporter: {
    fileName: 'reports/mutation/mutation-results.json'
  },
  
  // Advanced settings
  logLevel: 'info',
  fileLogLevel: 'trace',
  
  // Incremental mode for faster subsequent runs
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',
  
  // Disable mutations in specific scenarios
  disableTypeChecks: true,
  allowConsoleColors: true,
  
  // Custom mutation configuration for Vue components
  plugins: [
    '@stryker-mutator/core',
    '@stryker-mutator/vitest-runner',
    '@stryker-mutator/typescript-checker'
  ]
};

export default config;