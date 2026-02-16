/**
 * Main App Entry Point
 * Shows how to integrate the config manager with your application
 */

import React, { useState, useEffect } from "react";
import { ConfigProvider } from "../context/ConfigContext";
import SemanticLayerConfigManager from "./SemanticLayerConfigManager";
import { SemanticLayerConfig } from "../types/config";

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Load configuration from API
 * @throws Error if API call fails or response is invalid
 */
const fetchConfig = async (): Promise<SemanticLayerConfig> => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const response = await fetch(`${apiUrl}/semantic-layer/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(import.meta.env.VITE_API_TIMEOUT || 30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.error ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Failed to fetch configuration: ${errorMessage}`);
    }

    const config = await response.json();
    return config as SemanticLayerConfig;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error("Network error: Unable to reach API server. Check your connection and API_BASE_URL.");
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timeout: API server took too long to respond.");
    }
    throw error;
  }
};

/**
 * Save configuration to API
 * @returns Response with workflow deployment status
 * @throws Error if save fails
 */
const saveConfig = async (config: SemanticLayerConfig): Promise<{
  success: boolean;
  message: string;
  config_saved: boolean;
  workflow_deployed: boolean;
  workflow_deployment_details?: any;
}> => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

    // Include deploy_workflow flag if schedule is enabled
    const scheduleEnabled = config.sync?.schedule?.enabled || false;

    const response = await fetch(`${apiUrl}/semantic-layer/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config,
        deploy_workflow: scheduleEnabled  // Auto-deploy if schedule is enabled
      }),
      signal: AbortSignal.timeout(import.meta.env.VITE_API_TIMEOUT || 120000), // 2min timeout for workflow deployment
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.error ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Failed to save configuration: ${errorMessage}`);
    }

    // Parse and return the response
    const responseData = await response.json();

    return {
      success: responseData.success || false,
      message: responseData.message || "Configuration saved",
      config_saved: responseData.config_saved || false,
      workflow_deployed: responseData.workflow_deployed || false,
      workflow_deployment_details: responseData.workflow_deployment_details
    };

  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error("Network error: Unable to reach API server. Check your connection and API_BASE_URL.");
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timeout: API server took too long to respond. Workflow deployment may take longer.");
    }
    throw error;
  }
};

// ============================================================================
// APP WRAPPER
// ============================================================================
export const App: React.FC = () => {
  const [initialConfig, setInitialConfig] = useState<
    SemanticLayerConfig | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load initial configuration from API
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const config = await fetchConfig();
        setInitialConfig(config);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading configuration";

        console.error("Failed to load config:", err);
        setError(errorMessage);

        // Continue with empty config to allow manual creation
        setInitialConfig(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading" role="status" aria-label="Loading configuration">
        <div className="spinner" aria-hidden="true"></div>
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <ConfigProvider
      initialConfig={initialConfig}
      onSave={async (config) => {
        try {
          const result = await saveConfig(config);

          // Show success message with workflow deployment status
          if (result.success) {
            if (result.workflow_deployed) {
              console.log('✅ Configuration saved and workflow deployed successfully');
              // You could show a toast notification here
              alert(`✅ Success!\n\nConfiguration saved and workflow deployed to Treasure Data.\n\nSchedule: ${config.sync?.schedule?.frequency || 'manual'}`);
            } else {
              console.log('✅ Configuration saved successfully');
              alert('✅ Configuration saved successfully');
            }
          } else {
            // Partial success - config saved but workflow failed
            console.warn('⚠️ Configuration saved but workflow deployment failed', result);
            alert(`⚠️ Warning\n\nConfiguration saved but workflow deployment failed:\n${result.message}\n\nYou may need to deploy manually using: tdx wf push`);
          }

        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to save configuration";

          console.error("Save failed:", err);

          // Re-throw error so ConfigContext can handle it
          throw err;
        }
      }}
    >
      <SemanticLayerConfigManager />
    </ConfigProvider>
  );
};

export default App;
