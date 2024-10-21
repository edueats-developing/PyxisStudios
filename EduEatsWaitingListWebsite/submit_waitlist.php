<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

    // Validate the email address
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Store the email address in a file or database
        $file = 'waitlist_emails.txt'; // File to store emails
        $current = file_get_contents($file);
        $current .= $email . "\n";
        file_put_contents($file, $current);


        echo "Thank you for signing up! We'll be in touch soon.";
		header( "refresh: 1 Location: index.php" );

    } else {
        echo "Invalid email address.";
    }
} else {
    echo "Invalid request.";
}
?>
