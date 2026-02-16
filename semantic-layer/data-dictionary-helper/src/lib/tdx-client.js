import { spawn } from 'child_process';
import { readFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Execute a TDX CLI command and return parsed JSON output.
 *
 * SECURITY: Uses spawn with array arguments (no shell) to prevent command injection
 *
 * @param {string[]} args - Command arguments (e.g., ['ps', 'list', '--json'])
 * @param {object} options - Optional spawn options
 * @returns {Promise<object>} Parsed JSON output from TDX CLI
 * @throws {Error} If TDX is not installed, command fails, or output is invalid JSON
 */
export async function executeTdxCommand(args, options = {}) {
  // Create temp file for output redirection (workaround for TDX pipe buffering issue)
  const tempDir = await mkdtemp(join(tmpdir(), 'tdx-'));
  const tempFile = join(tempDir, 'output.json');

  return new Promise((resolve, reject) => {
    const stderrChunks = [];

    // SECURITY FIX: Use spawn with array args and output redirection via file descriptors
    // This avoids shell command injection vulnerabilities
    const enhancedPath = process.env.PATH + ':/usr/local/bin:/Users/' + process.env.USER + '/.local/bin';

    // Spawn TDX CLI process WITHOUT shell (critical security fix)
    const tdxProcess = spawn('tdx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],  // Capture stdout to pipe instead of file
      shell: false,  // CRITICAL: Never use shell with user input
      env: { ...process.env, PATH: enhancedPath },
      ...options
    });

    const stdoutChunks = [];

    // Capture stdout
    tdxProcess.stdout.on('data', (data) => {
      stdoutChunks.push(data);
    });

    // Capture stderr
    tdxProcess.stderr.on('data', (data) => {
      stderrChunks.push(data);
    });

    // Handle process errors (e.g., TDX not installed)
    tdxProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(
          'TDX CLI not found. Please install it globally:\n' +
          '  npm install -g @treasuredata/tdx\n' +
          'Then authenticate with:\n' +
          '  tdx auth'
        ));
      } else {
        reject(error);
      }
    });

    // Handle process exit
    tdxProcess.on('close', async (exitCode) => {
      const stderr = Buffer.concat(stderrChunks).toString();
      const stdout = Buffer.concat(stdoutChunks).toString();

      // Check for non-zero exit code
      if (exitCode !== 0) {
        // Check for common error patterns in stderr
        const stderrLower = stderr.toLowerCase();

        if (stderrLower.includes('authentication') || stderrLower.includes('not authenticated') || stderrLower.includes('unauthorized')) {
          reject(new Error(
            'TDX authentication failed. Please run:\n' +
            '  tdx auth\n' +
            'Error details: ' + stderr.trim()
          ));
          return;
        }

        if (stderrLower.includes('not found') && !stderrLower.includes('found')) {
          reject(new Error(
            'Resource not found.\n' +
            'Error details: ' + stderr.trim()
          ));
          return;
        }

        // Generic error with exit code
        const error = new Error(
          `TDX command failed with exit code ${exitCode}\n` +
          'Command: tdx ' + args.join(' ') + '\n' +
          'Error: ' + stderr.trim()
        );
        error.code = exitCode;
        error.stderr = stderr;
        reject(error);
        return;
      }

      // Success - parse JSON output from stdout
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        reject(new Error(
          'Failed to parse TDX JSON output.\n' +
          'Command: tdx ' + args.join(' ') + '\n' +
          'Parse error: ' + parseError.message
        ));
      }
    });
  });
}

/**
 * Check if TDX CLI is installed and available.
 *
 * SECURITY: Uses spawn without shell to prevent command injection
 *
 * @returns {Promise<boolean>} True if TDX is available
 * @throws {Error} If TDX is not installed with helpful installation message
 */
export async function checkTdxAvailable() {
  return new Promise((resolve, reject) => {
    const enhancedPath = process.env.PATH + ':/usr/local/bin:/Users/' + process.env.USER + '/.local/bin';

    // SECURITY: Use spawn with array args, no shell
    const tdxProcess = spawn('tdx', ['--version'], {
      env: { ...process.env, PATH: enhancedPath },
      shell: false  // CRITICAL: Never use shell
    });

    tdxProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.error('\n❌ TDX CLI is required but not found.\n');
        console.error('Please install it globally:');
        console.error('  npm install -g @treasuredata/tdx\n');
        console.error('Then authenticate with:');
        console.error('  tdx auth\n');
        process.exit(1);
      }
      reject(error);
    });

    tdxProcess.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve(true);
      } else {
        console.error('\n❌ TDX CLI is required but not found.\n');
        console.error('Please install it globally:');
        console.error('  npm install -g @treasuredata/tdx\n');
        console.error('Then authenticate with:');
        console.error('  tdx auth\n');
        process.exit(1);
      }
    });
  });
}
