import { execFileSync } from 'node:child_process';

// A native Windows "Open File" dialog (System.Windows.Forms, requires the
// -STA thread flag) so a non-technical admin can just click a file instead
// of typing a --pdf path on the command line. This blocks (synchronously)
// until the dialog is closed — that's the point, we're waiting on a human.
export function pickPdfFile(): string | null {
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
    "$dialog.Filter = 'PDF файлове (*.pdf)|*.pdf|Всички файлове (*.*)|*.*'",
    "$dialog.Title = 'Изберете фактура (PDF)'",
    "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName }",
  ].join('; ');

  try {
    const result = execFileSync('powershell', ['-NoProfile', '-STA', '-Command', script], {
      encoding: 'utf-8',
    });
    const path = result.trim();
    return path || null;
  } catch {
    return null;
  }
}
