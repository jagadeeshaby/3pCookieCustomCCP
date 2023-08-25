const jsonPrettify = (json) => {
  if (typeof json === "object" && json !== null) {
    const pretty = JSON.stringify(json, undefined, 4);
    return pretty;
  }

  try {
    const obj = JSON.parse(json);
    return jsonPrettify(obj);
  } catch (e) {
    return json;
  }
};

let defaultCcpParams = {
  loginPopup: true,
  loginPopupAutoClose: true, // optional, defaults to `false`
  softphone: {
    allowFramedSoftphone: true,
  },
  storageAccess: {
    canRequest: true,
    mode: "default",
    devTest: true,
    custom: {
      title: "Cookie Notice",
      description:
        "As per your browser policy, this website now explicitly requires permission to access cookies. Request access by clicking the below ‘Grant Access’ button and ‘Allow’ your browser permissions. This will only allow access to your login cookies. Read more",
      grantAccessButtonText: "Grant access",
      header: "Grant access",
      subHeader: "Grant access",
    },
    style: {
      "primary-color": "#077398",
      "primary-button-hover-color": "#034861",
      "link-color": "#0078c3",
      "banner-header-color": "#000",
      "banner-sub-header-color": "#000",
      "banner-title-color": "#201f1e",
      "banner-description-color": "#424242",
      "banner-access-request-background": "#e3f2fd",
      "banner-access-deny-background": "#fffde7",
      "banner-box-shadow": "0px 0.75px 3px 0px rgba(0, 0, 0, 0.15)",
      "banner-margin": "15px",
      "font-family": "'Amazon Ember', Arial, Helvetica, sans-serif",
    },
  },
};

let form = document.getElementById("inputForm");
var formData = new FormData(form);

document.getElementById("origin").innerHTML = location.origin;

const applyLocalValues = () => {
  document.getElementById("ccpUrl").value = localStorage.getItem("ccpUrl-v1");
  document.getElementById("ccpParams").value =
    (localStorage.getItem("ccpParams-v1") &&
      jsonPrettify(localStorage.getItem("ccpParams-v1"))) ||
    jsonPrettify(defaultCcpParams);
};

applyLocalValues();

const storeValueInMemory = (ccpUrl, ccpParams = {}) => {
  localStorage.setItem("ccpUrl-v1", ccpUrl);
  localStorage.setItem("ccpParams-v1", ccpParams);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();

  document.getElementById("submit").innerHTML = "Loading....";

  var ccpUrl = document.getElementById("ccpUrl").value;
  var ccpParams = document.getElementById("ccpParams").value;
  storeValueInMemory(ccpUrl, ccpParams);
  initCCP(ccpUrl, JSON.parse(ccpParams));
});

let agentAvailable = false;

document.getElementById("loadAgentInfo").addEventListener("click", () => {
  if (!agentAvailable) {
    alert(
      "Your agent CCP is not initialized yet, please click load custom CCP button"
    );
  } else {
    document.getElementById("AgentInfo").innerHTML = `<pre>${jsonPrettify(
      new connect.Agent().getConfiguration()
    )}</pre>`;
    $("#myModal").modal("toggle");
  }
});

isModalLayout = () => {
  return (
    appliedParams.storageAccess.layout === "modal" &&
    appliedParams.storageAccess.mode === "custom"
  );
};

let appliedParams = {};

function initCCP(ccpUrl, params = {}) {
  agentAvailable = false;

  document.getElementById("container-div").innerHTML = "";
  connect.core.terminate();

  if (params?.storageAccess?.mode) {
    if (params?.storageAccess?.mode === "custom") {
      document.getElementById("container-div").style.display = "none";
      document.getElementById("container-div").style.height = "350px";
    } else {
      document.getElementById("container-div").style.display = "block";
      document.getElementById("container-div").style.height = "460px";
    }
  } else {
    document.getElementById("container-div").style.display = "block";
    document.getElementById("container-div").style.height = "350px";
  }

  let ccpParams = {
    ...defaultCcpParams,
    ...params,
    ccpUrl,
    softphone: {
      ...defaultCcpParams?.softphone,
      ...params?.softphone,
    },
    storageAccess: {
      ...defaultCcpParams.storageAccess,
      ...params?.storageAccess,
      custom: {
        ...defaultCcpParams.storageAccess.custom,
        ...params?.storageAccess?.custom,
      },

      style: {
        ...defaultCcpParams.storageAccess.style,
        ...params?.storageAccess?.style,
      },
    },
  };
  appliedParams = ccpParams;

  if (isModalLayout()) {
    connect.core.initCCP(document.getElementById("rsaContainer"), ccpParams);
    document.getElementById("container-div").style.display = "none";
  } else {
    connect.core.initCCP(document.getElementById("container-div"), ccpParams);
  }

  connect?.storageAccess?.onRequest({
    onInit: (message) => {
      console.log("111111111", "init");
      // document.getElementById("container-div").style.display = "block";

      if (!message.data.hasAccess && isModalLayout()) {
        document.getElementById("rsaContainer").style.display = "block";

        $("#rsaModal").modal({ keyboard: false, backdrop: "static" }, "show");
      }

      if (!message.data.hasAccess) {
        document.getElementById("submit").innerHTML = "Load Custom CCP";
      }
    },

    onGrant: () => {
      console.log("22222222", "granted");
      // document.getElementById("container-div").style.display = "none";

      if (isModalLayout()) {
        $("#rsaModal").modal({ keyboard: false, backdrop: "static" }, "hide");
        document.getElementById("rsaContainer").style.display = "none";
      }

      document.getElementById("submit").innerHTML = "Load Custom CCP";
    },

    onDeny: () => {
      console.log("3333333", "onDenied");
      // document.getElementById("container-div").style.display = "block";
      if (isModalLayout()) {
        $("#rsaModal").modal({ keyboard: false, backdrop: "static" }, "show");
        document.getElementById("rsaContainer").style.display = "block";
      }

      document.getElementById("submit").innerHTML = "Load Custom CCP";
    },
  });

  connect?.agent((agent) => {
    agentAvailable = true;
    document.getElementById("submit").innerHTML = "Load Custom CCP";
    document.getElementById("agent-status").innerText = agent.getStatus().name;
    document.getElementById("agent-name").innerText = `Welcome ${
      agent.getConfiguration().username
    }`;
  });
}
