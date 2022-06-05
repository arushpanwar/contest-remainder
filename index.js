const axios = require("axios");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "lcs2020032@iiitl.ac.in", // generated ethereal user
        pass: "Arush@1234", // generated ethereal password
    },
});

async function get(url) {
    return (await axios.get(url)).data.result;
}

let CF_CONTESTS = [];

async function refreshCFContests() {
    CF_CONTESTS = await get("https://codeforces.com/api/contest.list");
}

function getCFContestsYetToStart() {
    return CF_CONTESTS.filter(c => c.phase === "BEFORE");

}

async function getLatestCFContest() {
    const beforeContests = getCFContestsYetToStart();
    return beforeContests[beforeContests.length - 1];

}

function timeToContest(contest_time_in_sec) {
    return contest_time_in_sec - (new Date().getTime() / 1000)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendMail(to, contest_name, contest_time, time_left) {
    return transporter.sendMail({
            from: 'lcs2020032@iiitl.ac.in', // sender address
            to: to, // list of receivers
            subject: `CONTEST IN ${time_left} minutes!`, // Subject line
            text: `Bro, ${contest_name} is starting in ${time_left} minutes, i.e, from ${contest_time}`, // plain text body
        }
    )
}

const SUBS = ["arushpanwar40@gmail.com", "lci2020012@iiitl.ac.in", "lcs2020020@iiitl.ac.in", "lcs2020025@iiitl.ac.in", "lcss2020019@iiitl.ac.in", "lcs2020008@iiitl.ac.in"]

let lastMail = 30;

const mailReminders = [5,10, 30, 60, 120];

function getNextTimeToSendMail() {
    const index = mailReminders.findIndex((c)=>c===lastMail);
    if (index > 0) return mailReminders[index - 1];
    else return -1;
}

async function execute() {
    await refreshCFContests();
    let latestContest = await getLatestCFContest();
    for (let i = 0; ; i++) {
        console.log(latestContest)

        if (i >= 60) {
            console.log("i>60 refreshing contests");
            await refreshCFContests();
            console.log("contests refreshed, getting latest contest")
            const latestContestTemp = await getLatestCFContest();
            if(latestContestTemp.id!==latestContest.id){

                lastMail=mailReminders[mailReminders.length-1]+100;
                console.log("latest contest not then same! setting lastMail to ",lastMail)

                latestContest=latestContestTemp

            }
            i = 0;
        }
        const nextTimeToSendMail = getNextTimeToSendMail();
        if (nextTimeToSendMail !== -1 && timeToContest(latestContest.startTimeSeconds) <= nextTimeToSendMail * 60) {
            console.log("sending emails for ",latestContest.name,nextTimeToSendMail)

            SUBS.forEach((s) => {
                console.log("sending email to ",s)

                sendMail(s,latestContest.name,new Date(latestContest.startTimeSeconds*1000).toString(),nextTimeToSendMail).then(()=>{
                    console.log("Mail sent to ",s);
                });
            })

            lastMail=nextTimeToSendMail;
            console.log("NEW LAST MAIL ",lastMail)
        }

        await sleep(60000)

    }

}

execute();