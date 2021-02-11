const sgMail= require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to:email,
        from:'almarina91@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancellingEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'almarina91@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Hi ${name}, we are sad to hear that you won't be using our services anymore. Let us know if we could do anything to address that.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellingEmail
}
