export const onCameraOpen = async (e) => {
    if (e.target.textContent === "Open Camera") {
        const videoConstraint = {
            audio: true,
            video: {
                height: 720,
                weight: 1280
            }
        };
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia(videoConstraint);
            window.localStream = stream;
            const videoElement = document.querySelector("#video");
            videoElement.srcObject = stream;
            e.target.textContent = "Closed Camera";
        }
        catch (err) {
            console.error("error opening video camera", err);
            const errorElement = document.getElementById("error");
            errorElement.textContent = err.message;
        }
    } else {
        try {
            const videoElement = document.querySelector("#video");
            videoElement.srcObject = null;
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    console.log("track");
                    track.stop()
                });
            }
            e.target.textContent = "Open Camera";
        } catch (err) {
            console.error("error closing video camera", err);
            const errorElement = document.getElementById("error");
            errorElement.textContent = err.message;
        }
    }
}