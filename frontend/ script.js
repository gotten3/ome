const socket = io("http://localhost:3000");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
let localStream, peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

document.getElementById("startBtn").onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  socket.emit("join");
};

socket.on("match", (partnerId) => {
  console.log("Matched with:", partnerId);
  createPeerConnection(partnerId, true);
});

socket.on("signal", async ({ from, signal }) => {
  if (!peerConnection) createPeerConnection(from, false);
  if (signal.sdp) await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
  if (signal.candidate) await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
});

function createPeerConnection(partnerId, isInitiator) {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit("signal", { to: partnerId, signal: { candidate } });
  };

  if (isInitiator) {
    peerConnection.createOffer().then(offer => {
      peerConnection.setLocalDescription(offer);
      socket.emit("signal", { to: partnerId, signal: { sdp: offer } });
    });
  }
}
