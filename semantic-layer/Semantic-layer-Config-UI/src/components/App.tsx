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
 * @throws Error if save fails
 */
const saveConfig = async (config: SemanticLayerConfig): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const response = await fetch(`${apiUrl}/semantic-layer/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
      signal: AbortSignal.timeout(import.meta.env.VITE_API_TIMEOUT || 30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.error ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Failed to save configuration: ${errorMessage}`);
    }

    // Verify response contains expected data
    const responseData = await response.json();
    if (!responseData.success && !responseData.data) {
      console.warn("Save response missing expected fields", responseData);
    }
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
          await saveConfig(config);
          // On successful save, show success message via context
          // (handled by ConfigContext with SET_LAST_SAVED action)
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
