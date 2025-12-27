/*****************************************************************************/
/*                              CVSS Information                             */
/*****************************************************************************/

// Note: not the same as severity
const CRITICALITY_CLASSES = {
  HIGH: "cvss-field-value-high",
  MEDIUM: "cvss-field-value-medium",
  LOW: "cvss-field-value-low",
};

const cvssV2_fields_map = {
  access_vector: {
    // Access vector
    full_name: "Access Vector",
    values: ["LOCAL", "ADJACENT NETWORK", "NETWORK"],
    text: {
      description:
        "This metric reflects how the vulnerability can be exploited.",
      value_descriptions: {
        L: "A vulnerability exploitable with only local access requires the attacker to have either physical access to the vulnerable system or a local (shell) account. Examples of locally exploitable vulnerabilities are peripheral attacks such as Firewire/USB DMA attacks, and local privilege escalations (e.g., sudo).",
        A: "A vulnerability exploitable with adjacent network access requires the attacker to have access to either the broadcast or collision domain of the vulnerable software.  Examples of local networks include local IP subnet, Bluetooth, IEEE 802.11, and local Ethernet segment.",
        N: "A vulnerability exploitable with network access means the vulnerable software is bound to the network stack and the attacker does not require local network access or local access. Such a vulnerability is often termed 'remotely exploitable'. An example of a network attack is an RPC buffer overflow.",
      },
    },
    class: {
      L: CRITICALITY_CLASSES.LOW, // Local
      A: CRITICALITY_CLASSES.MEDIUM, // Adjacent Network
      N: CRITICALITY_CLASSES.HIGH, // Network
    },
    value_map: {
      L: "LOCAL",
      A: "ADJACENT NETWORK",
      N: "NETWORK",
    },
  },
  access_complexity: {
    // Access complexity
    full_name: "Access Complexity",
    values: ["HIGH", "MEDIUM", "LOW"],
    text: {
      description:
        "This metric measures the complexity of the attack required to exploit the vulnerability once an attacker has gained access to the target system. For example, consider a buffer overflow in an Internet service: once the target system is located, the attacker can launch an exploit at will. Other vulnerabilities, however, may require additional steps in order to be exploited. For example, a vulnerability in an email client is only exploited after the user downloads and opens a tainted attachment.",
      value_descriptions: {
        H: "Specialized conditions exists for the attack that make it hard to be exploited, such as having to have elevated privileges, employing social engineering, emplying a vulnerable configuration or having a race condition.",
        M: "Additional conditions exists for the attack that make it harder to be exploited, such having a non-default configuration, employing social engineering, or required reconnaissance to grather information.",
        L: "Specialized access conditions or extenuating circumstances do not exist, making the vulnerability 'easy' to exploit. This implies that the attack can be performed manually and requires little skill or additional information gathering, the vulnerable configuration is in wide-spread use or the system is available to large number of users.",
      },
    },
    class: {
      H: CRITICALITY_CLASSES.LOW, // High
      M: CRITICALITY_CLASSES.MEDIUM, // Medium
      L: CRITICALITY_CLASSES.HIGH, // Low
    },
    value_map: {
      H: "HIGH",
      M: "MEDIUM",
      L: "LOW",
    },
  },
  confidentiality_impact: {
    // Confidentiality
    full_name: "Confidentiality Impact",
    values: ["NONE", "PARTIAL", "COMPLETE"],
    text: {
      description:
        "This metric measures the impact on confidentiality of a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.",
      value_descriptions: {
        N: "There is no impact to the confidentiality of the system.",
        P: "There is considerable informational disclosure. Access to some system files is possible, but the attacker does not have control over what is obtained, or the scope of the loss is constrained. An example is a vulnerability that divulges only certain tables in a database.",
        C: "There is total information disclosure, resulting in all system files being revealed. The attacker is able to read all of the system's data (memory, files, etc.)",
      },
    },
    class: {
      N: CRITICALITY_CLASSES.LOW, // None
      P: CRITICALITY_CLASSES.MEDIUM, // Partial
      C: CRITICALITY_CLASSES.HIGH, // Complete
    },
    value_map: {
      N: "NONE",
      P: "PARTIAL",
      C: "COMPLETE",
    },
  },
  integrity_impact: {
    // Integrity
    full_name: "Integrity Impact",
    values: ["NONE", "PARTIAL", "COMPLETE"],
    text: {
      description:
        "This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and guaranteed veracity of information.",
      value_descriptions: {
        N: "There is no impact to the integrity of the system.",
        P: "Modification of some system files or information is possible, but the attacker does not have control over what can be modified, or the scope of what the attacker can affect is limited. For example, system or application files may be overwritten or modified, but either the attacker has no control over which files are affected or the attacker can modify files within only a limited context or scope.",
        C: "There is a total compromise of system integrity. There is a complete loss of system protection, resulting in the entire system being compromised. The attacker is able to modify any files on the target system.",
      },
    },
    class: {
      N: CRITICALITY_CLASSES.LOW, // None
      P: CRITICALITY_CLASSES.MEDIUM, // Partial
      C: CRITICALITY_CLASSES.HIGH, // Complete
    },
    value_map: {
      N: "NONE",
      P: "PARTIAL",
      C: "COMPLETE",
    },
  },
  availability_impact: {
    // Availability
    full_name: "Availability Impact",
    values: ["NONE", "PARTIAL", "COMPLETE"],
    text: {
      description:
        "This metric measures the impact to availability of a successfully exploited vulnerability. Availability refers to the accessibility of information resources. Attacks that consume network bandwidth, processor cycles, or disk space all impact the availability of a system.",
      value_descriptions: {
        N: "There is no impact to the availability of the system.",
        P: "There is reduced performance or interruptions in resource availability. An example is a network-based flood attack that permits a limited number of successful connections to an Internet service.",
        C: "There is a total shutdown of the affected resource. The attacker can render the resource completely unavailable.",
      },
    },
    class: {
      N: CRITICALITY_CLASSES.LOW, // None
      P: CRITICALITY_CLASSES.MEDIUM, // Partial
      C: CRITICALITY_CLASSES.HIGH, // Complete
    },
    value_map: {
      N: "NONE",
      P: "PARTIAL",
      C: "COMPLETE",
    },
  },
  authentication: {
    // Authentication
    full_name: "Authentication",
    values: ["MULTIPLE", "SINGLE", "NONE"],
    text: {
      description:
        "This metric measures the number of times an attacker must authenticate to a target in order to exploit a vulnerability. This metric does not gauge the strength or complexity of the authentication process, only that an attacker is required to provide credentials before an exploit may occur.",
      value_descriptions: {
        M: "Exploiting the vulnerability requires that the attacker authenticate two or more times, even if the same credentials are used each time. An example is an attacker authenticating to an operating system in addition to providing credentials to access an application hosted on that system.",
        S: "The vulnerability requires an attacker to be logged into the system (such as at a command line or via a desktop session or web interface).",
        N: "Authentication is not required to exploit the vulnerability.",
      },
    },
    class: {
      M: CRITICALITY_CLASSES.LOW, // Multiple
      S: CRITICALITY_CLASSES.MEDIUM, // Single
      N: CRITICALITY_CLASSES.HIGH, // None
    },
    value_map: {
      M: "MULTIPLE",
      S: "SINGLE",
      N: "NONE",
    },
  },
  urser_interaction_required: {
    // User interaction required (Not part of the CVSSV2 specification but part of NVD's data structure)
    full_name: "User Interaction Required",
    values: ["TRUE", "FALSE"],
    text: {
      description:
        "This metric defines whether or not user interaction is required for the successfull exploitation of the vulnerability.",
      value_descriptions: {
        T: "User interaction is required for exploitation. The attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability (e.g., using social engineering techniques to trick a legitimate user into opening a malicious document).",
        F: "No user interaction is required for exploitation.",
      },
    },
    class: {
      T: CRITICALITY_CLASSES.LOW, // True
      F: CRITICALITY_CLASSES.HIGH, // False
    },
    value_map: {
      T: "TRUE",
      F: "FALSE",
    },
  },
};

const cvssV3_fields_map = {
  attack_vector: {
    // Attack vector
    full_name: "Attack Vector",
    values: ["PHYSICAL", "LOCAL", "ADJACENT NETWORK", "NETWORK"],
    text: {
      description:
        "This metric reflects the context by which vulnerability exploitation is possible.",
      value_descriptions: {
        P: "The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief (e.g., evil maid attack[^1]) or persistent. An example of such an attack is a cold boot attack in which an attacker gains access to disk encryption keys after physically accessing the target system. Other examples include peripheral attacks via FireWire/USB Direct Memory Access (DMA).",
        L: "The vulnerable component is not bound to the network stack and the attacker's path is via read/write/execute capabilities. Either: (1) the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or remotely (e.g., SSH); or (2) the attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability (e.g., using social engineering techniques to trick a legitimate user into opening a malicious document).",
        A: "The vulnerable component is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared physical (e.g., Bluetooth or IEEE 802.11) or logical (e.g., local IP subnet) network, or from within a secure or otherwise limited administrative domain (e.g., MPLS, secure VPN to an administrative network zone). One example of an Adjacent attack would be an ARP (IPv4) or neighbor discovery (IPv6) flood leading to a denial of service on the local LAN segment (e.g., CVE-2013-6014).",
        N: "The vulnerable component is bound to the network stack and the set of possible attackers extends beyond the other options listed above, up to and including the entire Internet. Such a vulnerability is often termed “remotely exploitable” and can be thought of as an attack being exploitable at the protocol level one or more network hops away (e.g., across one or more routers). An example of a network attack is an attacker causing a denial of service (DoS) by sending a specially crafted TCP packet across a wide area network (e.g., CVE-2004-0230).",
      },
    },
    class: {
      P: CRITICALITY_CLASSES.LOW, // Physical
      L: CRITICALITY_CLASSES.LOW, // Local
      A: CRITICALITY_CLASSES.MEDIUM, // Adjacent Network
      N: CRITICALITY_CLASSES.HIGH, // Network
    },
    value_map: {
      P: "PHYSICAL",
      L: "LOCAL",
      A: "ADJACENT NETWORK",
      N: "NETWORK",
    },
  },
  attack_complexity: {
    // Attack complexity
    full_name: "Attack Complexity",
    values: ["HIGH", "LOW"],
    text: {
      description:
        "This metric describes the conditions beyond the attacker's control that must exist in order to exploit the vulnerability.",
      value_descriptions: {
        H: "A successful attack depends on conditions beyond the attacker's control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected.[^2] For example, a successful attack may depend on an attacker overcoming any of the following conditions: (1) The attacker must gather knowledge about the environment in which the vulnerable target/component exists. For example, a requirement to collect details on target configuration settings, sequence numbers, or shared secrets. (2) The attacker must prepare the target environment to improve exploit reliability. For example, repeated exploitation to win a race condition, or overcoming advanced exploit mitigation techniques. (3) The attacker must inject themselves into the logical network path between the target and the resource requested by the victim in order to read and/or modify network communications (e.g., a man in the middle attack).",
        L: "Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success when attacking the vulnerable component.",
      },
    },
    class: {
      H: CRITICALITY_CLASSES.LOW, // High
      L: CRITICALITY_CLASSES.HIGH, // Low
    },
    value_map: {
      H: "HIGH",
      L: "LOW",
    },
  },
  confidentiality_impact: {
    // Confidentiality
    full_name: "Confidentiality",
    values: ["NONE", "LOW", "HIGH"],
    text: {
      description:
        "This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.",
      value_descriptions: {
        H: "There is a total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact. For example, an attacker steals the administrator's password, or private encryption keys of a web server.",
        L: "There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the impacted component.",
        N: "There is no loss of confidentiality within the impacted component.",
      },
    },
    class: {
      N: CRITICALITY_CLASSES.LOW, // None
      L: CRITICALITY_CLASSES.MEDIUM, // Low
      H: CRITICALITY_CLASSES.HIGH, // High
    },
    value_map: {
      N: "NONE",
      L: "LOW",
      H: "HIGH",
    },
  },
  integrity_impact: {
    // Integrity
    full_name: "Integrity",
    values: ["NONE", "LOW", "HIGH"],
    text: {
      description:
        "This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information.",
      value_descriptions: {
        H: "There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the impacted component. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the impacted component.",
        L: "Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact on the impacted component.",
        N: "There is no loss of integrity within the impacted component.",
      },
    },
    class: {
      N: CRITICALITY_CLASSES.LOW, // None
      L: CRITICALITY_CLASSES.MEDIUM, // Low
      H: CRITICALITY_CLASSES.HIGH, // High
    },
    value_map: {
      N: "NONE",
      L: "LOW",
      H: "HIGH",
    },
  },
  availability_impact: {
    // Availability
    full_name: "Availability",
    values: ["NONE", "LOW", "HIGH"],
    text: {
      description:
        "This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. While the Confidentiality and Integrity impact metrics apply to the loss of confidentiality or integrity of data (e.g., information, files) used by the impacted component, this metric refers to the loss of availability of the impacted component itself, such as a networked service (e.g., web, database, email). Since availability refers to the accessibility of information resources, attacks that consume network bandwidth, processor cycles, or disk space all impact the availability of an impacted component. ",
      value_descriptions: {
        H: "There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the impacted component (e.g., the attacker cannot disrupt existing connections, but can prevent new connections; the attacker can repeatedly exploit a vulnerability that, in each instance of a successful attack, leaks a only small amount of memory, but after repeated exploitation causes a service to become completely unavailable).",
        L: "Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the impacted component are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the impacted component.",
        N: "There is no impact to availability within the impacted component.",
      },
    },
    class: {
      N: CRITICALITY_CLASSES.LOW, // None
      L: CRITICALITY_CLASSES.MEDIUM, // Low
      H: CRITICALITY_CLASSES.HIGH, // High
    },
    value_map: {
      N: "NONE",
      L: "LOW",
      H: "HIGH",
    },
  },
  user_interaction: {
    // User interaction
    full_name: "User Interaction",
    values: ["REQUIRED", "NONE"],
    text: {
      description:
        "This metric captures the requirement for a human user, other than the attacker, to participate in the successful compromise of the vulnerable component. This metric determines whether the vulnerability can be exploited solely at the will of the attacker, or whether a separate user (or user-initiated process) must participate in some manner.",
      value_descriptions: {
        N: "The vulnerable system can be exploited without interaction from any user.",
        R: "Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited. For example, a successful exploit may only be possible during the installation of an application by a system administrator.",
      },
    },
    class: {
      R: CRITICALITY_CLASSES.LOW, // Required
      N: CRITICALITY_CLASSES.HIGH, // None
    },
    value_map: {
      R: "REQUIRED",
      N: "NONE",
    },
  },
  privileges_required: {
    // Privileges required
    full_name: "Privileges Required",
    values: ["HIGH", "LOW", "NONE"],
    text: {
      description:
        "This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability.",
      value_descriptions: {
        N: "The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files of the vulnerable system to carry out an attack.",
        H: "The attacker requires privileges that provide significant (e.g., administrative) control over the vulnerable component allowing access to component-wide settings and files.",
        L: "The attacker requires privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges has the ability to access only non-sensitive resources.",
      },
    },
    class: {
      H: CRITICALITY_CLASSES.LOW, // High
      L: CRITICALITY_CLASSES.MEDIUM, // Low
      N: CRITICALITY_CLASSES.HIGH, // None
    },
    value_map: {
      H: "HIGH",
      L: "LOW",
      N: "NONE",
    },
  },
  scope: {
    // Scope
    full_name: "Scope",
    values: ["UNCHANGED", "CHANGED"],
    text: {
      description:
        "The Scope metric captures whether a vulnerability in one vulnerable component impacts resources in components beyond its security scope.",
      value_descriptions: {
        U: "An exploited vulnerability can only affect resources managed by the same security authority. In this case, the vulnerable component and the impacted component are either the same, or both are managed by the same security authority.",
        C: "An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component. In this case, the vulnerable component and the impacted component are different and managed by different security authorities.",
      },
    },
    class: {
      U: CRITICALITY_CLASSES.LOW, // Unchanged
      C: CRITICALITY_CLASSES.HIGH, // Changed
    },
    value_map: {
      U: "UNCHANGED",
      C: "CHANGED",
    },
  },
};

export { cvssV2_fields_map, cvssV3_fields_map };
