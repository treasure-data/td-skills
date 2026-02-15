import { spawn } from 'child_process';
import { readFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Execute a TDX CLI command and return parsed JSON output.
 *
 * Uses output redirection to work around TDX CLI's pipe buffering limitations
 * (TDX truncates output at 64KB when stdout is a pipe, but works correctly with files).
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

    // Build command with stdout redirection only (keep stderr for progress messages)
    // Quote arguments that contain spaces or special characters
    const quotedArgs = args.map(arg => {
      if (arg.includes(' ') || arg.includes(':') || arg.includes('"')) {
        // Escape any existing double quotes and wrap in double quotes
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    });
    const command = `tdx ${quotedArgs.join(' ')} > "${tempFile}"`;

    // Spawn TDX CLI process via shell with output redirection
    const enhancedPath = process.env.PATH + ':/usr/local/bin:/Users/' + process.env.USER + '/.local/bin';
    const tdxProcess = spawn(command, {
      stdio: ['ignore', 'ignore', 'pipe'],
      shell: true,
      env: { ...process.env, PATH: enhancedPath },
      ...options
    });

    // Capture stderr only (stdout goes to file)
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

      // Check for non-zero exit code
      if (exitCode !== 0) {
        // Clean up temp file
        try { await unlink(tempFile); } catch {}

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

      // Success - read and parse JSON output from temp file
      try {
        const stdout = await readFile(tempFile, 'utf8');
        // Clean up temp file
        try { await unlink(tempFile); } catch {}

        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        // Clean up temp file on error
        try { await unlink(tempFile); } catch {}

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
 * @returns {Promise<boolean>} True if TDX is available
 * @throws {Error} If TDX is not installed with helpful installation message
 */
export async function checkTdxAvailable() {
  return new Promise((resolve, reject) => {
    const enhancedPath = process.env.PATH + ':/usr/local/bin:/Users/' + process.env.USER + '/.local/bin';
    const tdxProcess = spawn('tdx', ['--version'], {
      env: { ...process.env, PATH: enhancedPath }
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
