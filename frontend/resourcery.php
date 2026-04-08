<?php
session_start();

$host = "localhost";
$user = "root";
$pass = "root";
$db   = "resourcery";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) { die("Connection failed: " . $conn->connect_error); }

$page = isset($_GET['page']) ? $_GET['page'] : "login";

// Helper: is current user admin?
function is_admin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

// Registration
if (isset($_POST['action']) && $_POST['action'] == "register") {
    $fullname = $_POST['fullname'];
    $email    = $_POST['email'];
    $password = $_POST['password'];
    $confirm  = $_POST['confirm'];
    $role     = isset($_POST['role']) ? $_POST['role'] : 'resident';
    if (!in_array($role, ['admin','resident','organizer'])) $role = 'resident';
    if ($password !== $confirm) {
        $message = "Passwords do not match!";
    } else {
        $hp = password_hash($password, PASSWORD_DEFAULT);
        $ck = $conn->prepare("SELECT id FROM users WHERE email=?");
        $ck->bind_param("s", $email); $ck->execute(); $ck->store_result();
        if ($ck->num_rows > 0) {
            $message = "Email already registered!";
        } else {
            $ins = $conn->prepare("INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)");
            $ins->bind_param("ssss", $fullname, $email, $hp, $role);
            $message = $ins->execute() ? "Registration successful! You can now log in." : "Error: " . $ins->error;
        }
    }
}

// Login
if (isset($_POST['action']) && $_POST['action'] == "login") {
    $email    = $_POST['email'];
    $password = $_POST['password'];
    $ls = $conn->prepare("SELECT id, fullname, password, role FROM users WHERE email=?");
    $ls->bind_param("s", $email); $ls->execute(); $ls->store_result();
    if ($ls->num_rows > 0) {
        $ls->bind_result($id, $fn, $hp, $role); $ls->fetch();
        if (password_verify($password, $hp)) {
            $_SESSION['user_id']  = $id;
            $_SESSION['fullname'] = $fn;
            $_SESSION['role']     = $role;
            header("Location: resourcery.php?page=dashboard"); exit();
        } else { $message = "Invalid password!"; }
    } else { $message = "No account found with that email!"; }
}

// Logout
if ($page == "logout") { session_destroy(); header("Location: resourcery.php?page=login"); exit(); }

// Profile Update
if (isset($_POST['action']) && $_POST['action'] == "update_profile") {
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
    $fn  = trim($_POST['fullname']);
    $em  = trim($_POST['email']);
    $uid = $_SESSION['user_id'];
    if (strlen($fn) < 3) {
        $pmsg = "Full name must be at least 3 characters."; $perr = 1;
    } else {
        $ck2 = $conn->prepare("SELECT id FROM users WHERE email=? AND id != ?");
        $ck2->bind_param("si", $em, $uid); $ck2->execute(); $ck2->store_result();
        if ($ck2->num_rows > 0) {
            $pmsg = "That email is already in use."; $perr = 1;
        } else {
            $upd = $conn->prepare("UPDATE users SET fullname=?, email=? WHERE id=?");
            $upd->bind_param("ssi", $fn, $em, $uid);
            if ($upd->execute()) { $_SESSION['fullname'] = $fn; $pmsg = "Profile updated successfully!"; $perr = 0; }
            else { $pmsg = "Error updating profile."; $perr = 1; }
        }
    }
    header("Location: resourcery.php?page=profile&msg=" . urlencode($pmsg) . "&err=" . $perr); exit();
}

// Add Resource (admin only)
if (isset($_POST['action']) && $_POST['action'] == "add_resource") {
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
    if (!is_admin()) { header("Location: resourcery.php?page=dashboard"); exit(); }
    $rname  = trim($_POST['rname']);
    $rtype  = trim($_POST['rtype']);
    $rsched = trim($_POST['rsched']);
    $rstatus = $_POST['rstatus'];
    if (!in_array($rstatus, ['available','booked','under maintenance'])) $rstatus = 'available';
    $ri = $conn->prepare("INSERT INTO resources (name, type, availability_schedule, status) VALUES (?, ?, ?, ?)");
    $ri->bind_param("ssss", $rname, $rtype, $rsched, $rstatus);
    $rmsg = $ri->execute() ? "Resource added successfully!" : "Error: " . $ri->error;
    header("Location: resourcery.php?page=add_resource&msg=" . urlencode($rmsg)); exit();
}

// Book Resource
if (isset($_POST['action']) && $_POST['action'] == "book_resource") {
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
    $uid  = $_SESSION['user_id'];
    $rid  = (int)$_POST['resource_id'];
    $bdate = $_POST['bdate'];
    $btime = $_POST['btime'];
    // Conflict detection: same resource, same date, same time, not declined
    $cf = $conn->prepare("SELECT id FROM bookings WHERE resource_id=? AND date=? AND time=? AND status != 'declined'");
    $cf->bind_param("iss", $rid, $bdate, $btime); $cf->execute(); $cf->store_result();
    if ($cf->num_rows > 0) {
        $bmsg = "That time slot is already booked. Please choose another."; $berr = 1;
    } else {
        $bi = $conn->prepare("INSERT INTO bookings (user_id, resource_id, date, time) VALUES (?, ?, ?, ?)");
        $bi->bind_param("iiss", $uid, $rid, $bdate, $btime);
        if ($bi->execute()) { $bmsg = "Booking submitted! Awaiting admin approval."; $berr = 0; }
        else { $bmsg = "Error: " . $bi->error; $berr = 1; }
    }
    header("Location: resourcery.php?page=resources&msg=" . urlencode($bmsg) . "&err=" . $berr); exit();
}

// Approve / Decline Booking (admin only)
if (isset($_POST['action']) && $_POST['action'] == "update_booking") {
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
    if (!is_admin()) { header("Location: resourcery.php?page=dashboard"); exit(); }
    $bid    = (int)$_POST['booking_id'];
    $bstatus = $_POST['bstatus'];
    if (!in_array($bstatus, ['approved','declined'])) { header("Location: resourcery.php?page=manage_bookings"); exit(); }
    $ub = $conn->prepare("UPDATE bookings SET status=? WHERE id=?");
    $ub->bind_param("si", $bstatus, $bid); $ub->execute();
    header("Location: resourcery.php?page=manage_bookings&msg=" . urlencode("Booking " . $bstatus . ".")); exit();
}

// Delete Resource (admin only)
if (isset($_POST['action']) && $_POST['action'] == "delete_resource") {
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
    if (!is_admin()) { header("Location: resourcery.php?page=dashboard"); exit(); }
    $drid = (int)$_POST['resource_id'];
    $dr = $conn->prepare("DELETE FROM resources WHERE id=?");
    $dr->bind_param("i", $drid); $dr->execute();
    header("Location: resourcery.php?page=resources&msg=" . urlencode("Resource deleted.")); exit();
}

// Delete Member (admin only)
if (isset($_POST['action']) && $_POST['action'] == "delete_member") {
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
    if (!is_admin()) { header("Location: resourcery.php?page=dashboard"); exit(); }
    $dmid = (int)$_POST['member_id'];
    if ($dmid === (int)$_SESSION['user_id']) {
        header("Location: resourcery.php?page=members&msg=" . urlencode("You cannot delete your own account.")); exit();
    }
    $dm = $conn->prepare("DELETE FROM users WHERE id=?");
    $dm->bind_param("i", $dmid); $dm->execute();
    header("Location: resourcery.php?page=members&msg=" . urlencode("Member deleted.")); exit();
}

// Fetch data
$profile_data = null; $members = []; $resources = []; $bookings = [];
$total_resources = 0; $pending_bookings = 0;
if (isset($_SESSION['user_id'])) {
    $ps = $conn->prepare("SELECT fullname, email FROM users WHERE id=?");
    $ps->bind_param("i", $_SESSION['user_id']); $ps->execute();
    $ps->bind_result($pfn, $pfe); $ps->fetch(); $ps->close();
    $profile_data = ['fullname' => $pfn, 'email' => $pfe];

    $r = $conn->query("SELECT id, fullname, email, role FROM users ORDER BY id DESC");
    while ($row = $r->fetch_assoc()) { $members[] = $row; }

    $rr = $conn->query("SELECT * FROM resources ORDER BY id DESC");
    while ($row = $rr->fetch_assoc()) { $resources[] = $row; }
    $total_resources = count($resources);

    if (is_admin()) {
        $br = $conn->query("SELECT b.*, u.fullname as uname, res.name as rname FROM bookings b JOIN users u ON b.user_id=u.id JOIN resources res ON b.resource_id=res.id ORDER BY b.id DESC");
    } else {
        $uid_fetch = $_SESSION['user_id'];
        $br = $conn->query("SELECT b.*, u.fullname as uname, res.name as rname FROM bookings b JOIN users u ON b.user_id=u.id JOIN resources res ON b.resource_id=res.id WHERE b.user_id=$uid_fetch ORDER BY b.id DESC");
    }
    while ($row = $br->fetch_assoc()) { $bookings[] = $row; }

    $pc = $conn->query("SELECT COUNT(*) as cnt FROM bookings WHERE status='pending'");
    $pcrow = $pc->fetch_assoc(); $pending_bookings = $pcrow['cnt'];
}

$dash_pages = ['dashboard','members','profile','add_member','resources','add_resource','bookings','manage_bookings'];
$is_dash = in_array($page, $dash_pages);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resourcery</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<?php if (!$is_dash): ?>
<div class="auth-grid-overlay"></div>
<div class="auth-bg-shapes">
    <div class="auth-shape auth-shape-1"></div><div class="auth-shape auth-shape-2"></div>
    <div class="auth-shape auth-shape-3"></div><div class="auth-shape auth-shape-4"></div>
    <div class="auth-shape auth-shape-5"></div><div class="auth-shape auth-shape-6"></div>
</div>
<div class="auth-wave-pattern"><div class="auth-wave"></div><div class="auth-wave"></div></div>
<div class="auth-bg-circle auth-circle-1"></div>
<div class="auth-bg-circle auth-circle-2"></div>
<div class="auth-bg-circle auth-circle-3"></div>
<?php endif; ?>

<?php if ($is_dash):
    if (!isset($_SESSION['user_id'])) { header("Location: resourcery.php?page=login"); exit(); }
?>
<div class="dashboard-container">
    <div class="grid-overlay"></div>
    <div class="bg-shapes">
        <div class="shape shape-1"></div><div class="shape shape-2"></div>
        <div class="shape shape-3"></div><div class="shape shape-4"></div>
        <div class="shape shape-5"></div><div class="shape shape-6"></div>
    </div>
    <div class="wave-pattern"><div class="wave"></div><div class="wave"></div></div>
    <div class="bg-decoration bg-circle-1"></div>
    <div class="bg-decoration bg-circle-2"></div>
    <div class="bg-decoration bg-circle-3"></div>

    <aside class="dashboard-sidebar">
        <div class="sidebar-header">
            <div class="resourcery-icon">
                <img src="../assets/resourcery-logo.png" alt="Resourcery">
                <span class="resourcery-icon-text">Resourcery</span>
            </div>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">MAIN</div>
                <a href="?page=dashboard" class="sidebar-link <?php echo $page=='dashboard'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Dashboard
                </a>
                <a href="?page=resources" class="sidebar-link <?php echo $page=='resources'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    Resources
                </a>
                <a href="?page=bookings" class="sidebar-link <?php echo $page=='bookings'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <?php echo is_admin() ? 'All Bookings' : 'My Bookings'; ?>
                </a>
                <?php if (is_admin()): ?>
                <a href="?page=manage_bookings" class="sidebar-link <?php echo $page=='manage_bookings'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Manage Bookings
                    <?php if ($pending_bookings > 0): ?>
                    <span class="badge-count"><?php echo $pending_bookings; ?></span>
                    <?php endif; ?>
                </a>
                <?php endif; ?>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">MEMBERS</div>
                <a href="?page=members" class="sidebar-link <?php echo $page=='members'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
                    Members
                </a>
                <?php if (is_admin()): ?>
                <a href="?page=add_member" class="sidebar-link <?php echo $page=='add_member'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    Add Member
                </a>
                <a href="?page=add_resource" class="sidebar-link <?php echo $page=='add_resource'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Add Resource
                </a>
                <?php endif; ?>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">ACCOUNT</div>
                <a href="?page=profile" class="sidebar-link <?php echo $page=='profile'?'active':''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                </a>
                <a href="?page=logout" class="sidebar-link logout-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                </a>
            </div>
        </nav>
    </aside>

    <main class="dashboard-content">
        <header class="dashboard-header">
            <div class="header-left">
                <?php
                $titles = [
                    'dashboard'      => ['Welcome back, ' . htmlspecialchars(explode(' ', $_SESSION['fullname'])[0]) . '!', "Here's what's happening today"],
                    'members'        => ['Members', 'All registered users in the system'],
                    'add_member'     => ['Add Member', 'Register a new user to the system'],
                    'profile'        => ['My Profile', 'Manage your account details'],
                    'resources'      => ['Resources', 'Browse and book community resources'],
                    'add_resource'   => ['Add Resource', 'Add a new resource to the system'],
                    'bookings'       => [is_admin() ? 'All Bookings' : 'My Bookings', 'View booking history and status'],
                    'manage_bookings'=> ['Manage Bookings', 'Approve or decline pending booking requests'],
                ];
                $t = isset($titles[$page]) ? $titles[$page] : ['Dashboard', ''];
                ?>
                <h1 class="dashboard-title"><?php echo $t[0]; ?></h1>
                <p class="dashboard-subtitle"><?php echo $t[1]; ?></p>
            </div>
            <div class="header-right">
                <a href="?page=profile" class="header-btn-icon <?php echo $page=='profile'?'active':''; ?>" title="Profile">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </a>
                <a href="?page=logout" class="header-btn-primary">Logout</a>
            </div>
        </header>


        <?php if (isset($_GET['msg'])): ?>
        <div class="page-message <?php echo (isset($_GET['err']) && $_GET['err']=='0') ? 'success' : ''; ?>">
            <?php echo htmlspecialchars($_GET['msg']); ?>
        </div>
        <?php endif; ?>

        <?php if ($page == 'dashboard'): ?>
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-icon purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo count($members); ?></div>
                    <div class="stat-label">Total Members</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $total_resources; ?></div>
                    <div class="stat-label">Total Resources</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo date('M d'); ?></div>
                    <div class="stat-label">Today's Date</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value"><?php echo $pending_bookings; ?></div>
                    <div class="stat-label">Pending Bookings</div>
                </div>
            </div>
        </div>
        <div class="content-section">
            <div class="section-header">
                <h2 class="section-title">Recent Resources</h2>
                <a href="?page=resources" class="btn-text">View All</a>
            </div>
            <div class="activity-card">
                <div class="activity-list">
                    <?php $recent_res = array_slice($resources, 0, 4);
                    if (empty($recent_res)): ?>
                        <p style="color:#8b92c4;text-align:center;padding:20px 0;">No resources yet.</p>
                    <?php else: foreach ($recent_res as $res): ?>
                    <div class="activity-item">
                        <div class="activity-icon orange">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title"><?php echo htmlspecialchars($res['name']); ?> <span class="status-badge status-<?php echo str_replace(' ','-',$res['status']); ?>"><?php echo ucfirst($res['status']); ?></span></div>
                            <div class="activity-time"><?php echo htmlspecialchars($res['type']); ?></div>
                        </div>
                    </div>
                    <?php endforeach; endif; ?>
                </div>
            </div>
        </div>

        <?php elseif ($page == 'resources'): ?>
        <div class="content-section" style="padding-top:32px;">
            <div class="section-header">
                <h2 class="section-title">All Resources (<?php echo $total_resources; ?>)</h2>
                <?php if (is_admin()): ?>
                <a href="?page=add_resource" class="btn-text">+ Add Resource</a>
                <?php endif; ?>
            </div>
            <div class="search-bar-wrap">
                <div class="search-bar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="resourceSearch" placeholder="Search resources by name or type..." oninput="filterResources(this.value)">
                </div>
            </div>
            <?php if (empty($resources)): ?>
            <div class="activity-card"><p style="color:#8b92c4;text-align:center;padding:32px;">No resources found.</p></div>
            <?php else: ?>
            <div class="resources-grid" id="resourcesGrid">
                <?php foreach ($resources as $res): ?>
                <div class="resource-card" data-search="<?php echo strtolower(htmlspecialchars($res['name'] . ' ' . $res['type'])); ?>">
                    <div class="resource-card-header">
                        <div class="resource-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        </div>
                        <span class="status-badge status-<?php echo str_replace(' ','-',$res['status']); ?>"><?php echo ucfirst($res['status']); ?></span>
                    </div>
                    <div class="resource-name"><?php echo htmlspecialchars($res['name']); ?></div>
                    <div class="resource-type"><?php echo htmlspecialchars($res['type']); ?></div>
                    <?php if ($res['availability_schedule']): ?>
                    <div class="resource-schedule"><?php echo htmlspecialchars($res['availability_schedule']); ?></div>
                    <?php endif; ?>
                    <div class="resource-actions">
                        <?php if ($res['status'] === 'available'): ?>
                        <button class="btn-book" onclick="openBookModal(<?php echo $res['id']; ?>, '<?php echo htmlspecialchars(addslashes($res['name'])); ?>')">Book Now</button>
                        <?php else: ?>
                        <button class="btn-book disabled" disabled>Unavailable</button>
                        <?php endif; ?>
                        <?php if (is_admin()): ?>
                        <form method="POST" action="resourcery.php" style="display:inline;" onsubmit="return confirm('Delete this resource?')">
                            <input type="hidden" name="action" value="delete_resource">
                            <input type="hidden" name="resource_id" value="<?php echo $res['id']; ?>">
                            <button type="submit" class="btn-delete">Delete</button>
                        </form>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <p id="resourceNoResults" style="display:none;color:#8b92c4;text-align:center;padding:32px;">No resources match your search.</p>
            <?php endif; ?>
        </div>

        <!-- Book Modal -->
        <div id="bookModal" class="modal-overlay" style="display:none;">
            <div class="modal-box">
                <h3 class="modal-title">Book Resource</h3>
                <p class="modal-subtitle" id="modalResourceName"></p>
                <form method="POST" action="resourcery.php">
                    <input type="hidden" name="action" value="book_resource">
                    <input type="hidden" name="resource_id" id="modalResourceId">
                    <div class="form-group"><label>Date</label><input type="date" name="bdate" required min="<?php echo date('Y-m-d'); ?>"></div>
                    <div class="form-group"><label>Time</label><input type="time" name="btime" required></div>
                    <div style="display:flex;gap:12px;margin-top:8px;">
                        <button type="submit" class="header-btn-primary" style="flex:1;padding:12px;border-radius:50px;font-size:15px;text-align:center;">Confirm Booking</button>
                        <button type="button" class="btn-cancel" onclick="closeBookModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <?php elseif ($page == 'add_resource'): ?>
        <?php if (!is_admin()): ?>
        <div class="page-message">Access denied.</div>
        <?php else: ?>
        <div class="content-section" style="padding-top:32px;max-width:520px;">
            <?php if (isset($_GET['msg'])): ?>
            <div class="page-message <?php echo strpos($_GET['msg'],'successfully')!==false?'success':''; ?>" style="margin-bottom:20px;">
                <?php echo htmlspecialchars($_GET['msg']); ?>
            </div>
            <?php endif; ?>
            <div class="activity-card">
                <form method="POST" action="resourcery.php">
                    <input type="hidden" name="action" value="add_resource">
                    <div class="form-group"><label>Resource Name</label><input type="text" name="rname" required placeholder="e.g. Sound System"></div>
                    <div class="form-group"><label>Type</label><input type="text" name="rtype" required placeholder="e.g. Equipment"></div>
                    <div class="form-group"><label>Availability Schedule</label><input type="text" name="rsched" placeholder="e.g. Mon-Fri 8am-5pm"></div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="rstatus" class="form-select">
                            <option value="available">Available</option>
                            <option value="booked">Booked</option>
                            <option value="under maintenance">Under Maintenance</option>
                        </select>
                    </div>
                    <button type="submit" class="header-btn-primary" style="width:100%;padding:12px;border-radius:50px;font-size:15px;text-align:center;">Add Resource</button>
                </form>
            </div>
        </div>
        <?php endif; ?>

        <?php elseif ($page == 'bookings'): ?>
        <div class="content-section" style="padding-top:32px;">
            <div class="section-header">
                <h2 class="section-title"><?php echo is_admin() ? 'All Bookings' : 'My Bookings'; ?> (<?php echo count($bookings); ?>)</h2>
            </div>
            <div class="activity-card">
                <table class="members-table">
                    <thead><tr><th>#</th><th>Resource</th><?php if (is_admin()): ?><th>Member</th><?php endif; ?><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                        <?php if (empty($bookings)): ?>
                        <tr><td colspan="6" style="text-align:center;color:#8b92c4;padding:32px;">No bookings found.</td></tr>
                        <?php else: foreach ($bookings as $i => $b): ?>
                        <tr>
                            <td><?php echo $i + 1; ?></td>
                            <td><?php echo htmlspecialchars($b['rname']); ?></td>
                            <?php if (is_admin()): ?><td><?php echo htmlspecialchars($b['uname']); ?></td><?php endif; ?>
                            <td><?php echo htmlspecialchars($b['date']); ?></td>
                            <td><?php echo htmlspecialchars(date('h:i A', strtotime($b['time']))); ?></td>
                            <td><span class="status-badge status-<?php echo $b['status']; ?>"><?php echo ucfirst($b['status']); ?></span></td>
                        </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <?php elseif ($page == 'manage_bookings'): ?>
        <?php if (!is_admin()): ?>
        <div class="page-message">Access denied.</div>
        <?php else: ?>
        <div class="content-section" style="padding-top:32px;">
            <?php if (isset($_GET['msg'])): ?>
            <div class="page-message success" style="margin-bottom:20px;"><?php echo htmlspecialchars($_GET['msg']); ?></div>
            <?php endif; ?>
            <div class="section-header">
                <h2 class="section-title">Manage Bookings</h2>
            </div>
            <div class="activity-card">
                <table class="members-table">
                    <thead><tr><th>#</th><th>Resource</th><th>Member</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        <?php if (empty($bookings)): ?>
                        <tr><td colspan="7" style="text-align:center;color:#8b92c4;padding:32px;">No bookings found.</td></tr>
                        <?php else: foreach ($bookings as $i => $b): ?>
                        <tr>
                            <td><?php echo $i + 1; ?></td>
                            <td><?php echo htmlspecialchars($b['rname']); ?></td>
                            <td><?php echo htmlspecialchars($b['uname']); ?></td>
                            <td><?php echo htmlspecialchars($b['date']); ?></td>
                            <td><?php echo htmlspecialchars(date('h:i A', strtotime($b['time']))); ?></td>
                            <td><span class="status-badge status-<?php echo $b['status']; ?>"><?php echo ucfirst($b['status']); ?></span></td>
                            <td>
                                <?php if ($b['status'] === 'pending'): ?>
                                <form method="POST" action="resourcery.php" style="display:inline;">
                                    <input type="hidden" name="action" value="update_booking">
                                    <input type="hidden" name="booking_id" value="<?php echo $b['id']; ?>">
                                    <input type="hidden" name="bstatus" value="approved">
                                    <button type="submit" class="btn-approve">Approve</button>
                                </form>
                                <form method="POST" action="resourcery.php" style="display:inline;">
                                    <input type="hidden" name="action" value="update_booking">
                                    <input type="hidden" name="booking_id" value="<?php echo $b['id']; ?>">
                                    <input type="hidden" name="bstatus" value="declined">
                                    <button type="submit" class="btn-decline">Decline</button>
                                </form>
                                <?php else: ?>
                                <span style="color:#8b92c4;font-size:13px;">—</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>

        <?php elseif ($page == 'members'): ?>
        <div class="content-section" style="padding-top:32px;">
            <div class="section-header">
                <h2 class="section-title">All Members (<?php echo count($members); ?>)</h2>
                <?php if (is_admin()): ?>
                <a href="?page=add_member" class="btn-text">+ Add Member</a>
                <?php endif; ?>
            </div>
            <div class="search-bar-wrap">
                <div class="search-bar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="memberSearch" placeholder="Search members by name or email..." oninput="filterMembers(this.value)">
                </div>
            </div>
            <div class="activity-card">
                <table class="members-table" id="membersTable">
                    <thead><tr><th>#</th><th>Full Name</th><th>Email</th><th>Role</th><?php if (is_admin()): ?><th>Action</th><?php endif; ?></tr></thead>
                    <tbody id="membersBody">
                        <?php if (empty($members)): ?>
                        <tr><td colspan="5" style="text-align:center;color:#8b92c4;padding:32px;">No members found.</td></tr>
                        <?php else: foreach ($members as $i => $m): ?>
                        <tr data-search="<?php echo strtolower(htmlspecialchars($m['fullname'] . ' ' . $m['email'])); ?>">
                            <td><?php echo $i + 1; ?></td>
                            <td><?php echo htmlspecialchars($m['fullname']); ?></td>
                            <td><?php echo htmlspecialchars($m['email']); ?></td>
                            <td><span class="role-badge role-<?php echo $m['role']; ?>"><?php echo ucfirst($m['role']); ?></span></td>
                            <?php if (is_admin()): ?>
                            <td>
                                <?php if ($m['id'] != $_SESSION['user_id']): ?>
                                <form method="POST" action="resourcery.php" style="display:inline;" onsubmit="return confirm('Delete this member?')">
                                    <input type="hidden" name="action" value="delete_member">
                                    <input type="hidden" name="member_id" value="<?php echo $m['id']; ?>">
                                    <button type="submit" class="btn-delete">Delete</button>
                                </form>
                                <?php else: ?>
                                <span style="color:#d1d5db;font-size:13px;">—</span>
                                <?php endif; ?>
                            </td>
                            <?php endif; ?>
                        </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
                <p id="memberNoResults" style="display:none;color:#8b92c4;text-align:center;padding:32px;">No members match your search.</p>
            </div>
        </div>

        <?php elseif ($page == 'add_member'): ?>
        <?php if (!is_admin()): ?>
        <div class="page-message">Access denied.</div>
        <?php else: ?>
        <div class="content-section" style="padding-top:32px;max-width:520px;">
            <?php if (isset($message)): ?>
                <div class="message <?php echo strpos($message,'successful')!==false?'success':''; ?>" style="margin-bottom:20px;">
                    <?php echo htmlspecialchars($message); ?>
                </div>
            <?php endif; ?>
            <div class="activity-card">
                <form method="POST" action="?page=add_member">
                    <input type="hidden" name="action" value="register">
                    <div class="form-group"><label>Full Name</label><input type="text" name="fullname" required></div>
                    <div class="form-group"><label>Email Address</label><input type="email" name="email" required></div>
                    <div class="form-group"><label>Password</label><input type="password" name="password" required></div>
                    <div class="form-group"><label>Confirm Password</label><input type="password" name="confirm" required></div>
                    <div class="form-group">
                        <label>Role</label>
                        <select name="role" class="form-select">
                            <option value="resident">Resident</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit" class="header-btn-primary" style="width:100%;padding:12px;border-radius:50px;font-size:15px;text-align:center;">Register Member</button>
                </form>
            </div>
        </div>
        <?php endif; ?>

        <?php elseif ($page == 'profile'): ?>
        <div class="content-section" style="padding-top:32px;max-width:520px;">
            <?php if (isset($_GET['msg'])): ?>
                <div class="message <?php echo $_GET['err']=='0'?'success':''; ?>" style="margin-bottom:20px;">
                    <?php echo htmlspecialchars($_GET['msg']); ?>
                </div>
            <?php endif; ?>
            <div class="activity-card">
                <div style="margin-bottom:16px;">
                    <?php $r = isset($_SESSION['role']) ? $_SESSION['role'] : 'resident'; ?>
                    <span class="role-badge role-<?php echo $r; ?>"><?php echo ucfirst($r); ?></span>
                </div>
                <form method="POST" action="?page=profile">
                    <input type="hidden" name="action" value="update_profile">
                    <div class="form-group"><label>Full Name</label><input type="text" name="fullname" value="<?php echo htmlspecialchars($profile_data['fullname']); ?>" required></div>
                    <div class="form-group"><label>Email Address</label><input type="email" name="email" value="<?php echo htmlspecialchars($profile_data['email']); ?>" required></div>
                    <button type="submit" class="header-btn-primary" style="width:100%;padding:12px;border-radius:50px;font-size:15px;text-align:center;">Save Changes</button>
                </form>
            </div>
        </div>
        <?php endif; ?>

    </main>
</div>

<?php elseif ($page == "login"): ?>
<div class="header">
    <div class="resourcery-icon">
        <img src="../assets/resourcery-logo.png" alt="Resourcery">
        <span class="resourcery-icon-text">Resourcery</span>
    </div>
</div>
<div class="container">
    <div class="form-card">
        <h2>Login</h2>
        <?php if (isset($message)): ?>
            <div class="message <?php echo strpos($message,'successful')!==false?'success':''; ?>"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
        <form method="POST" action="resourcery.php">
            <input type="hidden" name="action" value="login">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="loginEmail" name="email" required>
                <div class="error-icon">&#x2715; Please enter a valid email</div>
            </div>
            <div class="form-group">
                <label>Password</label>
                <div class="password-wrapper">
                    <input type="password" id="loginPassword" name="password" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('loginPassword', this)">&#x2299;</span>
                </div>
            </div>
            <button type="submit" class="submit-btn" id="loginBtn">Login</button>
        </form>
        <div class="form-footer">No account yet? <a href="resourcery.php?page=register">Register</a></div>
    </div>
</div>

<?php elseif ($page == "register"): ?>
<div class="header">
    <div class="resourcery-icon">
        <img src="../assets/resourcery-logo.png" alt="Resourcery">
        <span class="resourcery-icon-text">Resourcery</span>
    </div>
</div>
<div class="container">
    <div class="form-card">
        <h2>Register</h2>
        <?php if (isset($message)): ?>
            <div class="message <?php echo strpos($message,'successful')!==false?'success':''; ?>"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
        <form method="POST" action="resourcery.php">
            <input type="hidden" name="action" value="register">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="fullname" name="fullname" required>
                <div class="error-icon">&#x2715; Full name is required</div>
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="registerEmail" name="email" required>
                <div class="error-icon">&#x2715; Please enter a valid email</div>
            </div>
            <div class="form-group">
                <label>Password</label>
                <div class="password-wrapper">
                    <input type="password" id="registerPassword" name="password" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('registerPassword', this)">&#x2299;</span>
                </div>
                <div class="password-strength"><div class="strength-bar" id="strengthBar"></div></div>
                <div class="strength-text" id="strengthText"></div>
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <div class="password-wrapper">
                    <input type="password" id="confirmPassword" name="confirm" required>
                    <span class="toggle-password" onclick="togglePasswordVisibility('confirmPassword', this)">&#x2299;</span>
                </div>
                <div id="passwordMatch"></div>
            </div>
            <button type="submit" class="submit-btn" id="registerBtn">Sign Up</button>
        </form>
        <div class="form-footer">Already have an account? <a href="resourcery.php?page=login">Log in</a></div>
    </div>
</div>
<?php endif; ?>

<script src="auth.js"></script>
<script>
function openBookModal(id, name) {
    document.getElementById('modalResourceId').value = id;
    document.getElementById('modalResourceName').textContent = name;
    document.getElementById('bookModal').style.display = 'flex';
}
function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeBookModal();
});

function filterMembers(q) {
    q = q.toLowerCase();
    var rows = document.querySelectorAll('#membersBody tr[data-search]');
    var visible = 0;
    rows.forEach(function(row) {
        var match = row.getAttribute('data-search').includes(q);
        row.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    var noRes = document.getElementById('memberNoResults');
    if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
}

function filterResources(q) {
    q = q.toLowerCase();
    var cards = document.querySelectorAll('#resourcesGrid .resource-card[data-search]');
    var visible = 0;
    cards.forEach(function(card) {
        var match = card.getAttribute('data-search').includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    var noRes = document.getElementById('resourceNoResults');
    if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
}
</script>
</body>
</html>
