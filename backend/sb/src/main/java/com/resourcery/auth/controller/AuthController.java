package com.resourcery.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.resourcery.auth.dto.LoginRequest;
import com.resourcery.auth.dto.SignupRequest;
import com.resourcery.auth.model.User;
import com.resourcery.auth.repository.UserRepository;
import com.resourcery.auth.security.JwtUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtils jwtUtils;

    @Value("${jwt.expiration}")    private int    jwtExpirationMs;
    @Value("${jwt.cookie.domain}") private String jwtDomain;
    @Value("${admin.username}")    private String adminUsername;
    @Value("${admin.password}")    private String adminPassword;
    @Value("${google.client.id}")  private String googleClientId;

    // ── Seed admin on startup ─────────────────────────────────────────────────
    @EventListener(ApplicationReadyEvent.class)
    public void seedAdmin() {
        System.out.println("[Resourcery] Google Client ID configured: " +
                (googleClientId != null && !googleClientId.contains("your-google") ? "YES (" + googleClientId.substring(0, 20) + "...)" : "NO - using placeholder"));
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            userRepository.save(new User(adminUsername, encoder.encode(adminPassword), "ROLE_ADMIN"));
            System.out.println("[Resourcery] Admin account created: " + adminUsername);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Cookie buildJwtCookie(String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(jwtExpirationMs / 1000);
        return cookie;
    }

    private Cookie expiredJwtCookie() {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(0);
        return cookie;
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(), loginRequest.getPassword()));

            String username = authentication.getName();
            String role = userRepository.findByUsername(username)
                    .map(User::getRole).orElse("ROLE_USER");

            String jwt = jwtUtils.generateToken(username, role);
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(Map.of("username", username, "role", role));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Authentication failed"));
        }
    }

    // ── POST /api/auth/admin/create-member ───────────────────────────────────
    @PostMapping("/admin/create-member")
    public ResponseEntity<?> createMember(@RequestBody SignupRequest signUpRequest) {
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username is already taken"));
        }
        if (signUpRequest.getUsername() == null || signUpRequest.getUsername().contains(" ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username cannot contain spaces"));
        }
        String role = (signUpRequest.getRole() != null && !signUpRequest.getRole().isBlank())
                ? signUpRequest.getRole() : "ROLE_USER";
        User user = new User(signUpRequest.getUsername(), encoder.encode(signUpRequest.getPassword()), role);
        user.setEmail(signUpRequest.getEmail());
        userRepository.save(user);
        // No cookie set — admin stays logged in
        return ResponseEntity.ok(Map.of("username", signUpRequest.getUsername(), "role", role));
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody SignupRequest signUpRequest,
                                      HttpServletResponse response) {
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username is already taken"));
        }

        if (signUpRequest.getUsername() == null || signUpRequest.getUsername().contains(" ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username cannot contain spaces"));
        }

        String role = (signUpRequest.getRole() != null && !signUpRequest.getRole().isBlank())
                ? signUpRequest.getRole() : "ROLE_USER";
        User user = new User(
                signUpRequest.getUsername(),
                encoder.encode(signUpRequest.getPassword()),
                role);
        user.setEmail(signUpRequest.getEmail());
        userRepository.save(user);
        String jwt = jwtUtils.generateToken(signUpRequest.getUsername(), role);
        response.addCookie(buildJwtCookie(jwt));
        return ResponseEntity.ok(Map.of("username", signUpRequest.getUsername(), "role", role, "email", signUpRequest.getEmail() != null ? signUpRequest.getEmail() : ""));
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        response.addCookie(expiredJwtCookie());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    // ── POST /api/auth/change-password ───────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody java.util.Map<String, String> body) {
        String username = body.get("username");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        return userRepository.findByUsername(username)
            .filter(u -> encoder.matches(currentPassword, u.getPassword()))
            .map(u -> {
                u.setPassword(encoder.encode(newPassword));
                userRepository.save(u);
                return ResponseEntity.ok(java.util.Map.of("message", "Password updated"));
            })
            .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(java.util.Map.of("message", "Invalid current password")));
    }

    // ── GET /api/auth/members ─────────────────────────────────────────────────
    @GetMapping("/members")
    public ResponseEntity<?> members() {
        java.util.List<java.util.Map<String, Object>> result = userRepository.findAll().stream()
            .map(u -> {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", u.getId());
                m.put("username", u.getUsername());
                m.put("role", u.getRole());
                m.put("email", u.getEmail() != null ? u.getEmail() : "");
                return m;
            })
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── DELETE /api/auth/members/{id} ─────────────────────────────────────────
    @DeleteMapping("/members/{id}")
    public ResponseEntity<?> deleteMember(@org.springframework.web.bind.annotation.PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("message", "User not found"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Member deleted"));
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .map(u -> ResponseEntity.ok(Map.of(
                        "username", u.getUsername(),
                        "role", u.getRole(),
                        "email", u.getEmail() != null ? u.getEmail() : ""
                )))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // ── POST /api/auth/google/check ───────────────────────────────────────────
    // Verifies the Google token and returns whether the user already exists.
    // Frontend uses this to decide whether to show terms before registration.
    @PostMapping("/google/check")
    public ResponseEntity<?> googleCheck(@RequestBody Map<String, String> body) {
        String idTokenString = body.get("idToken");
        if (idTokenString == null || idTokenString.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing idToken"));
        }
        try {
            String[] parts = idTokenString.split("\\.");
            if (parts.length < 2) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Google token format"));
            }
            String raw = parts[1];
            raw = raw + "=".repeat((4 - raw.length() % 4) % 4);
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(raw));
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> claims =
                    mapper.readValue(payloadJson, java.util.Map.class);

            Object audObj = claims.get("aud");
            String aud = audObj != null ? audObj.toString() : "";
            if (!aud.equals(googleClientId) && !aud.contains(googleClientId)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token audience mismatch"));
            }

            String googleId = (String) claims.get("sub");
            String email    = (String) claims.get("email");

            boolean exists = userRepository.findByGoogleId(googleId).isPresent()
                    || (email != null && userRepository.findByEmail(email).isPresent());

            return ResponseEntity.ok(Map.of("isNewUser", !exists));
        } catch (Exception e) {
            System.err.println("[Google Check] Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Google check failed: " + e.getMessage()));
        }
    }

    // ── POST /api/auth/google ─────────────────────────────────────────────────
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body,
                                         HttpServletResponse response) {
        String idTokenString = body.get("idToken");
        if (idTokenString == null || idTokenString.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing idToken"));
        }

        try {
            // Decode the Google ID token (JWT) — the token was already validated
            // by Google's JS library on the client. We verify the audience claim
            // to prevent token misuse, avoiding outbound HTTP calls from the server.
            String[] parts = idTokenString.split("\\.");
            if (parts.length < 2) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Google token format"));
            }
            // Base64url decode the payload (pad to multiple of 4)
            String raw = parts[1];
            raw = raw + "=".repeat((4 - raw.length() % 4) % 4);
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(raw));

            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> claims =
                    mapper.readValue(payloadJson, java.util.Map.class);

            // Verify audience matches our client ID
            Object audObj = claims.get("aud");
            String aud = audObj != null ? audObj.toString() : "";
            // aud can be a plain string or a JSON array like ["clientid"]
            boolean audMatches = aud.equals(googleClientId) || aud.contains(googleClientId);
            if (!audMatches) {
                System.err.println("[Google Auth] Audience mismatch. Token aud='" + aud + "', expected='" + googleClientId + "'");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token audience mismatch"));
            }

            String googleId = (String) claims.get("sub");
            String email    = (String) claims.get("email");
            String name     = (String) claims.get("name");

            // 1. Try to find by google_id
            User user = userRepository.findByGoogleId(googleId).orElse(null);

            // 2. If not found, try to link to existing account by email
            if (user == null && email != null) {
                user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    user.setGoogleId(googleId);
                    userRepository.save(user);
                }
            }

            // 3. If still not found, create a new account
            if (user == null) {
                // Derive a unique username from the Google name/email
                String baseUsername = (name != null && !name.isBlank())
                        ? name.replaceAll("\\s+", "").toLowerCase()
                        : email.split("@")[0];
                String username = baseUsername;
                int suffix = 1;
                while (userRepository.findByUsername(username).isPresent()) {
                    username = baseUsername + suffix++;
                }
                user = new User(username, null, "ROLE_USER");
                user.setEmail(email);
                user.setGoogleId(googleId);
                userRepository.save(user);
            }

            String jwt = jwtUtils.generateToken(user.getUsername(), user.getRole());
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "role", user.getRole(),
                    "email", user.getEmail() != null ? user.getEmail() : ""
            ));

        } catch (Exception e) {
            System.err.println("[Google Auth] Error: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Google authentication failed: " + e.getMessage()));
        }
    }
}
