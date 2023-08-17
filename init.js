const jsonPrettify = (json) => {
    if (typeof json === 'object' && json !== null) {
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
    loginPopupAutoClose: true,   // optional, defaults to `false`
    softphone: {
        allowFramedSoftphone: true,
        disableRingtone: false,
    },
    storageAccess: {
        canRequest: true,
        mode: "custom",
        force: true,
        // instanceUrl: "https://jagadeey-integ.my.dev.us-west-2.nonprod.connect.aws.a2z.com",
        custom: {
            title: "Jag Notice",
            description: "Jag As per your browser policy, this website now explicitly requires permission to access cookies. Request access by clicking the below ‘Grant Access’ button and ‘Allow’ your browser permissions. This will only allow access to your login cookies. Read more",
            buttonText: "Jag Grant Access"
        }
    }
};

let form = document.getElementById("inputForm");
var formData = new FormData(form);

const applyLocalValues = () => {
    document.getElementById("ccpUrl").value = localStorage.getItem("ccpUrl");
    document.getElementById("ccpParams").value = localStorage.getItem("ccpParams") && jsonPrettify(localStorage.getItem("ccpParams")) || jsonPrettify(defaultCcpParams);
}

applyLocalValues();


const storeValueInMemory = (ccpUrl, ccpParams = {}) => {
    localStorage.setItem("ccpUrl", ccpUrl);
    localStorage.setItem("ccpParams", ccpParams);
}

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
        alert("Your agent CCP is not initialized yet, please click load custom CCP button")
    } else {
        document.getElementById("AgentInfo").innerHTML = `<pre>${jsonPrettify(new connect.Agent().getConfiguration())}</pre>`;
        $('#myModal').modal('toggle')
    }
});

isModalLayout = () => {
    return appliedParams.storageAccess.layout === "modal" && appliedParams.storageAccess.mode === "custom";
}

let appliedParams = {};

function initCCP(ccpUrl, params = {}) {

    agentAvailable = false;

    document.getElementById("container-div").innerHTML = "";
    connect.core.terminate();

    if (params?.storageAccess?.mode === "default") {
        document.getElementById("container-div").style.display = "block";
        document.getElementById("container-div").style.height = "460px"
    } else {
        document.getElementById("container-div").style.display = "none";
        document.getElementById("container-div").style.height = "200px";
    }

    let ccpParams = {
        ...defaultCcpParams,
        ...params,
        ccpUrl,
        softphone: {
            ...defaultCcpParams?.softphone,
            ...params?.softphone
        },
        storageAccess: {
            ...defaultCcpParams.storageAccess,
            ...params?.storageAccess,
            custom: {
                ...defaultCcpParams.storageAccess.custom,
                ...params?.storageAccess?.custom
            }
        }
    }
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

                $('#rsaModal').modal({ keyboard: false, backdrop: 'static' }, 'show');
            }


            if(!message.data.hasAccess){
                document.getElementById("submit").innerHTML = "Load Custom CCP";
            }
        },

        onGrant: () => {
            console.log("22222222", "granted");
            // document.getElementById("container-div").style.display = "none";

            if (isModalLayout()) {
                $('#rsaModal').modal({ keyboard: false, backdrop: 'static' }, 'hide');
                document.getElementById("rsaContainer").style.display = "none";

            }

            document.getElementById("submit").innerHTML = "Load Custom CCP";
        },

        onDeny: () => {
            console.log("3333333", "onDenied");
            // document.getElementById("container-div").style.display = "block";
            if (isModalLayout()) {

                $('#rsaModal').modal({ keyboard: false, backdrop: 'static' }, 'show');
                document.getElementById("rsaContainer").style.display = "block";

            }

            document.getElementById("submit").innerHTML = "Load Custom CCP";
        }
    });

    connect?.agent((agent) => {
        agentAvailable = true;
        document.getElementById("submit").innerHTML = "Load Custom CCP";
        document.getElementById("agent-status").innerText = agent.getStatus().name;
        document.getElementById("agent-name").innerText = `Welcome ${agent.getConfiguration().username}`;
    })

}