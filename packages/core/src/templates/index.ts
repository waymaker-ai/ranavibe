export const DEFAULT_RANA_CONFIG = `version: "1.0.0"

project:
  name: "My Project"
  type: "fullstack"
  description: "Project description"
  languages:
    - "typescript"

standards:
  principles:
    - search_before_create
    - real_data_only
    - test_everything
    - design_system_compliance
    - deploy_to_production

quality_gates:
  pre_implementation:
    - name: "Search for existing implementations"
      description: "Find existing patterns before creating new ones"
      required: true

  implementation:
    - name: "TypeScript strict mode compliance"
      description: "No 'any' types, proper type definitions"
      required: true

  testing:
    - name: "Manual testing completed"
      description: "Test all user flows manually"
      required: true

  deployment:
    - name: "Deploy to production"
      description: "Deploy and verify feature works"
      required: true
`;

export class TemplateManager {
  /**
   * Get default RANA config template
   */
  getDefaultConfig(): string {
    return DEFAULT_RANA_CONFIG;
  }

  /**
   * Generate config for a specific project type
   */
  generateConfig(projectType: 'nextjs' | 'react' | 'python'): string {
    // TODO: Add project-specific templates
    return DEFAULT_RANA_CONFIG;
  }
}
