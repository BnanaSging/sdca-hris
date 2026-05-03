<?php
require 'auth-check.php';
require 'config.php';

// Only allow admin to export
if (!isset($_SESSION['position']) || strtolower($_SESSION['position']) !== 'admin') {
    die('Unauthorized');
}

$export_type = isset($_POST['export_type']) ? $_POST['export_type'] : '';

if ($export_type !== 'pdf') {
    die('Invalid export type');
}

// Get audit log
$auditlog_file = 'auditlog.json';
$auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];

// Organize data by categories
$leave_actions = [];
$balance_changes = [];
$announcement_changes = [];

foreach (array_reverse($auditlog) as $entry) {
    $action = strtolower($entry['action'] ?? '');
    if (in_array($action, ['approve', 'approved', 'deny', 'denied', 'applied'])) {
        $leave_actions[] = $entry;
    } elseif (($entry['action'] ?? '') === 'Leave Balance Updated') {
        $balance_changes[] = $entry;
    } elseif (in_array($entry['action'] ?? '', ['Announcement Created', 'Announcement Updated', 'Announcement Deleted'])) {
        $announcement_changes[] = $entry;
    }
}

$users = getUsers();
$html = generateDetailedReport($leave_actions, $balance_changes, $announcement_changes, $users);
$pdf = createPDF($html);

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="audit_report_' . date('Y-m-d_H-i-s') . '.pdf"');
header('Content-Length: ' . strlen($pdf));
echo $pdf;
exit();

function generateDetailedReport($leave_actions, $balance_changes, $announcement_changes, $users) {
    $report = "COMPREHENSIVE AUDIT TRAIL REPORT\n";
    $report .= "Generated: " . date('Y-m-d H:i:s') . "\n";
    $report .= "=" . str_repeat("=", 78) . "=\n\n";
    
    // Summary Section
    $report .= "EXECUTIVE SUMMARY\n";
    $report .= str_repeat("-", 80) . "\n";
    $report .= "Total Leave Actions:          " . count($leave_actions) . "\n";
    $report .= "Total Balance Changes:        " . count($balance_changes) . "\n";
    $report .= "Total Announcement Changes:   " . count($announcement_changes) . "\n";
    $report .= "\n\n";
    
    // Leave Actions Section
    $report .= "SECTION 1: LEAVE ACTIONS\n";
    $report .= str_repeat("-", 80) . "\n";
    $report .= sprintf("%-11s | %-10s | %-15s | %-15s | %-10s\n", "DateTime", "Action", "Employee", "Type", "Status");
    $report .= str_repeat("-", 80) . "\n";
    
    if (count($leave_actions) > 0) {
        foreach ($leave_actions as $entry) {
            $ts = substr($entry['timestamp'] ?? '', 5, 11);
            $action = substr($entry['action'] ?? '', 0, 10);
            $emp = substr($entry['employee_name'] ?? '', 0, 15);
            $type = substr($entry['leave_type'] ?? '', 0, 15);
            $status = substr($entry['new_status'] ?? $entry['status'] ?? '', 0, 10);
            
            $report .= sprintf("%-11s | %-10s | %-15s | %-15s | %-10s\n", $ts, $action, $emp, $type, $status);
        }
    } else {
        $report .= "No leave actions recorded.\n";
    }
    
    $report .= "\n\n";
    
    // Balance Changes Section
    $report .= "SECTION 2: LEAVE BALANCE CHANGES\n";
    $report .= str_repeat("-", 80) . "\n";
    $report .= sprintf("%-11s | %-15s | %-12s | %-6s | %-6s | %-7s\n", "DateTime", "Employee", "Type", "Old", "New", "Change");
    $report .= str_repeat("-", 80) . "\n";
    
    if (count($balance_changes) > 0) {
        foreach ($balance_changes as $entry) {
            $ts = substr($entry['timestamp'] ?? '', 5, 11);
            $emp = '-';
            foreach ($users as $u) {
                if ($u['id'] == $entry['user_id']) {
                    $emp = substr($u['name'], 0, 15);
                    break;
                }
            }
            
            $type = substr($entry['leave_type'] ?? '', 0, 12);
            $old = $entry['old_balance'] ?? '-';
            $new = $entry['new_balance'] ?? '-';
            $change = ($old !== '-' && $new !== '-') ? ($new - $old) : '-';
            
            $report .= sprintf("%-11s | %-15s | %-12s | %-6s | %-6s | %-7s\n", $ts, $emp, $type, $old, $new, $change);
        }
    } else {
        $report .= "No balance changes recorded.\n";
    }
    
    $report .= "\n\n";
    
    // Announcements Section
    $report .= "SECTION 3: ANNOUNCEMENTS\n";
    $report .= str_repeat("-", 80) . "\n";
    $report .= sprintf("%-11s | %-10s | %-28s | %-8s | %-10s\n", "DateTime", "Action", "Title", "Pinned", "Expires");
    $report .= str_repeat("-", 80) . "\n";
    
    if (count($announcement_changes) > 0) {
        foreach ($announcement_changes as $entry) {
            $ts = substr($entry['timestamp'] ?? '', 5, 11);
            $action = substr($entry['action'] ?? '', 0, 10);
            $title = substr($entry['title'] ?? '', 0, 28);
            $pinned = isset($entry['pinned']) ? ($entry['pinned'] ? 'Yes' : 'No') : '-';
            $expires = substr($entry['expires_at'] ?? 'Never', 0, 10);
            
            $report .= sprintf("%-11s | %-10s | %-28s | %-8s | %-10s\n", $ts, $action, $title, $pinned, $expires);
        }
    } else {
        $report .= "No announcement changes recorded.\n";
    }
    
    $report .= "\n\n";
    $report .= "=" . str_repeat("=", 78) . "=\n";
    $report .= "End of Report\n";
    
    return $report;
}

function createPDF($text) {
    $lines = explode("\n", $text);
    $lines_per_page = 45;
    $page_count = max(1, ceil(count($lines) / $lines_per_page));
    
    $pdf = "%PDF-1.4\n";
    $objects = [];
    
    // Catalog
    $objects[1] = "1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n";
    
    // Pages
    $kids = "";
    for ($i = 0; $i < $page_count; $i++) {
        $kids .= ($i + 3) . " 0 R ";
    }
    $objects[2] = "2 0 obj\n<</Type/Pages/Kids[" . trim($kids) . "]/Count " . $page_count . ">>\nendobj\n";
    
    $obj_num = 3;
    
    // Create pages
    for ($page = 0; $page < $page_count; $page++) {
        $start = $page * $lines_per_page;
        $end = min($start + $lines_per_page, count($lines));
        
        $content = "BT\n/F1 9 Tf\n40 750 Td\n";
        for ($i = $start; $i < $end; $i++) {
            $line = isset($lines[$i]) ? $lines[$i] : "";
            $line = substr($line, 0, 100);
            $line = str_replace(['(', ')', '\\'], ['\(', '\)', '\\\\'], $line);
            $content .= "(" . $line . ") Tj\n";
            $content .= "0 -11 Td\n";
        }
        $content .= "ET\n";
        
        $stream_obj = $obj_num + 1;
        $objects[$stream_obj] = $stream_obj . " 0 obj\n<</Length " . strlen($content) . ">>\nstream\n" . $content . "endstream\nendobj\n";
        
        $objects[$obj_num] = $obj_num . " 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents " . $stream_obj . " 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Courier>>>>>>\nendobj\n";
        
        $obj_num += 2;
    }
    
    // Font
    $objects[$obj_num] = $obj_num . " 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Courier>>\nendobj\n";
    $max_obj = $obj_num;
    
    // Build PDF
    $pdf_content = "%PDF-1.4\n";
    $offsets = [0];
    
    foreach (range(1, $max_obj) as $i) {
        $offsets[$i] = strlen($pdf_content);
        if (isset($objects[$i])) {
            $pdf_content .= $objects[$i];
        }
    }
    
    // Xref
    $xref_pos = strlen($pdf_content);
    $pdf_content .= "xref\n0 " . ($max_obj + 1) . "\n";
    $pdf_content .= "0000000000 65535 f\n";
    for ($i = 1; $i <= $max_obj; $i++) {
        $pdf_content .= str_pad($offsets[$i], 10, "0", STR_PAD_LEFT) . " 00000 n\n";
    }
    
    // Trailer
    $pdf_content .= "trailer\n<</Size " . ($max_obj + 1) . "/Root 1 0 R>>\n";
    $pdf_content .= "startxref\n" . $xref_pos . "\n";
    $pdf_content .= "%%EOF\n";
    
    return $pdf_content;
}
?>
