// Type declarations for amplify_outputs.json
declare module './amplify_outputs.json' {
  interface AmplifyConfig {
    auth: {
      user_pool_id: string;
      aws_region: string;
      user_pool_client_id: string;
      identity_pool_id: string;
      mfa_methods: string[];
      standard_required_attributes: string[];
      username_attributes: string[];
      user_verification_types: string[];
      groups: string[];
      mfa_configuration: string;
      password_policy: {
        min_length: number;
        require_lowercase: boolean;
        require_numbers: boolean;
        require_symbols: boolean;
        require_uppercase: boolean;
      };
      unauthenticated_identities_enabled: boolean;
    };
    data: {
      url: string;
      aws_region: string;
      api_key: string;
      default_authorization_type: string;
      authorization_types: string[];
      model_introspection: any;
    };
    version: string;
    custom: {
      apiMode: string;
      environment: string;
      dataStorage: string;
    };
  }
  
  const value: AmplifyConfig;
  export default value;
}

// Also declare for relative paths from config directory
declare module '../../../amplify_outputs.json' {
  import amplifyConfig from './amplify_outputs.json';
  export default amplifyConfig;
}