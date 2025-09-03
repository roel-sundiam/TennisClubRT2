Rich Town 2 Tennis Court Schedule Project Plan for Club Members

This app is for Club members who want to reserve a court schedule. Let's use Angular for frontend, express.js for backend and mongodb for database. The application will be used through mobiles/devices, please make it mobile friendly (PWA is needed). CSS design must be modern and professional.

Registration

1.  Interested Club Member need to register to the application (Full Name, username, gender etc). In the registration page, we need to include some rules like a membership fee is need to be paid before it will be approved. Also, it will be a coin based system that need make payment for them to use the app. But they will get free coins.
2.  Approvement of registered Member will be approved by supseruser admin (create me a superadmin account, username superadmin, password admin123).
3.  Approved users will have access to the tool by logging in and they will have admin to change password and view their profile info.
4.  There are already registered Club members that can be imported from the legacy database. The format of the username is FirstnameLastName, example if the name is Roel Sundiam, username is RoelSundiam and let's put a default password of RT2Tennis

Court Reservation

1.  To use the court, member will need to schedule a court if they want to use it.
2.  There will be a form to schedule court (Date, time and players who will be playing). Court availability is only from 5:00 AM to 10:00 PM and to schedule time it will be whole time like 5:00 AM, 6:00 PM and not like 5:30 PM.
3.  Form Validations are needed like if schedule was previously reserved, if the date is past etc, also if court payment of a member is not yet done
4.  Member should have a view of all court schedules
5.  Member will have option to edit or delete what they reserved

--verify all valdations

Schedules List

1.  In the list of schedules page/ui view, we need to put a weather forecast for each time (Delapaz Norte, San Fernando Pampanga, Philippines), let's use weatherApiKey: 'your-openweather-api-key-here', // Replace with actual key in production
    weatherApiBaseUrl: 'https://api.openweathermap.org/data/2.5', const lat = 15.087;
    const lon = 120.6285;

Court Payment

1.  Member will need to log for the payment. Just a simple form, indicate the date of reservation and the amount to be paid.
2.  If member is not yet paid, he/she will not be able to reserve a court

--
In the log payment, all selected/included players in reservation will need to log a payment in the Payment Management.  
Court fee is computed 100 pesos per hour for time 5am, 6pm, 7pm and 9pm. If time is other 5am, 6pm, 7pm and 9pm it will be than 20 pesos/hr per member. For example 3 members, court fee will be 20 each if time is other than 5am, 6pm, 7pm and 9pm . But for example 2 members only, they will still need to pay 100 divided by each which is 50 pesos per hour for 5am, 6pm, 7pm and 9pm.

Club Members

1.  We need to have a page that shows all members profile.

Court Receipts Report

1.  We need to have a report of all court payment receipts.

Suggestion/Complaint Page

1.  We need to have a suggestion/complaints page form (for the improvement of the club/court)
2.  All answers will only be visible for superadmins

Poll Page

1.  Let's create a poll feature and only members can vote. When a new pole is created a message should be visible.

For monetary income of the app, we will use a coin based system of each member.

1.  Member will need to have coin balance for them to use the app
2.  Coin consumption is based on the page that was visit
3.  Members can request coins through form and the superuser admin will take care of giving them coins
4.  There will be warning once coins is nearly insufficient
5.  New Register will have free coins

Site Analysis

1.  We need to have a view of all pages that were visit and the usernames that visited.
