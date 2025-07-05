console.log('Lets WRite JAVASCRIPT');
let currentSong = new Audio();
let songs;
let currfolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currfolder = folder;
    const res = await fetch(`/${folder}/`);
    const html = await res.text();

    const parser = document.createElement("div");
    parser.innerHTML = html;
    const links = parser.getElementsByTagName("a");

    songs = [];
    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            songs.push(link.href.split(`/${folder}/`)[1]);
        }
    }

    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        const fullName = decodeURIComponent(song).replace(".mp3", "").trim();
        const [title, artist] = fullName.split("-").map(s => s.trim());

        songUL.innerHTML += `
        <li>
            <img width="34" src="images/music.svg" alt="">
            <div class="info">
                <div>${title || "Unknown Title"}</div>
                <div>${artist || "Unknown Artist"}</div>
            </div>
            <div class="playnow">
                <span>Play</span>
                <img src="images/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(songUL.children).forEach((li, i) => {
        li.addEventListener("click", () => {
            playMusic(songs[i]);
        });
    });

    return songs;
}

function playMusic(track, pause = false) {
    currentSong.src = `/${currfolder}/` + track;

    if (!pause) {
        currentSong.play();
        play.src = "images/pause.svg";
    }

    const cleanName = decodeURIComponent(track).replace(".mp3", "").split("-")[0].trim();
    document.querySelector(".songinfo").innerHTML = cleanName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    console.log("Displaying albums...");

    const res = await fetch(`/songs/`);
    const html = await res.text();
    const div = document.createElement("div");
    div.innerHTML = html;

    const anchors = div.getElementsByTagName("a");
    const cardContainer = document.querySelector(".cardContainer");

    for (const anchor of anchors) {
        if (anchor.href.includes("/songs/")) {
            const folder = anchor.href.split("/").filter(Boolean).pop();

            try {
                const metaRes = await fetch(`/songs/${folder}/info.json`);
                const meta = await metaRes.json();

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="/images/play.svg" alt="">
                    </div>
                    <img width="100%" src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                </div>`;
            } catch (err) {
                console.error(`info.json missing or invalid in /songs/${folder}/`, err);
            }
        }
    }

    Array.from(document.querySelectorAll(".card")).forEach(card => {
        card.addEventListener("click", async () => {
            songs = await getSongs(`songs/${card.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/DHH");
    playMusic(songs[0], true);
    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "images/pause.svg";
        } else {
            currentSong.pause();
            play.src = "images/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        const time = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".songtime").innerHTML = time;
        document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width);
        document.querySelector(".circle").style.left = `${percent * 100}%`;
        currentSong.currentTime = currentSong.duration * percent;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".Left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".Left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume img").src = currentSong.volume > 0 ? "images/volume.svg" : "images/mute.svg";
    });

    document.querySelector(".volume img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "images/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "images/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
