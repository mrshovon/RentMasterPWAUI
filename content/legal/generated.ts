// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by scripts/build-legal.mjs from the markdown in the parent folder's legal/ directory.
// Edit those .md files and re-run `npm run build:legal`.

export type LegalRun =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "code"; v: string }
  | { t: "link"; v: string; href: string };

export type LegalBlock =
  | { type: "h"; level: number; runs: LegalRun[] }
  | { type: "p"; runs: LegalRun[] }
  | { type: "list"; ordered: boolean; items: LegalRun[][] }
  | { type: "table"; head: LegalRun[][]; rows: LegalRun[][][] }
  | { type: "hr" };

export interface LegalDoc { title: string; blocks: LegalBlock[] }

/**
 * The published edition of these documents, taken from the "Effective date" line of the English
 * Terms. Empty while that line still holds the [EFFECTIVE DATE] placeholder — the signup form
 * falls back to the backend's value, so consent is still recorded against something real.
 */
export const LEGAL_VERSION = "";

export const LEGAL_DOCS = {
  "privacyEn": {
    "title": "Bari360 — Privacy Policy",
    "blocks": [
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Effective date:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "Last updated:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "Applies to:"
          },
          {
            "t": "text",
            "v": " the Bari360 web application at "
          },
          {
            "t": "code",
            "v": "https://www.bari360.space"
          },
          {
            "t": "text",
            "v": " and the Bari360 Android application (package "
          },
          {
            "t": "code",
            "v": "com.rentmaster.app"
          },
          {
            "t": "text",
            "v": ")."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "This policy is published in English and Bangla. "
          },
          {
            "t": "bold",
            "v": "The English version is authoritative."
          },
          {
            "t": "text",
            "v": " If the two versions ever conflict, the English text governs."
          }
        ]
      },
      {
        "type": "hr"
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "1. Who we are"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 (\"Bari360\", \"we\", \"us\") is a property and tenancy management service for landlords and tenants in Bangladesh. It is operated by:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Operator:"
            },
            {
              "t": "text",
              "v": " [LEGAL ENTITY NAME]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Registered address:"
            },
            {
              "t": "text",
              "v": " [REGISTERED ADDRESS]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Registration / trade licence:"
            },
            {
              "t": "text",
              "v": " [TRADE LICENCE / REG. NO.]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Email:"
            },
            {
              "t": "text",
              "v": " [SUPPORT EMAIL]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Phone:"
            },
            {
              "t": "text",
              "v": " [SUPPORT PHONE]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Privacy / grievance contact:"
            },
            {
              "t": "text",
              "v": " [GRIEVANCE CONTACT]"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "There are three kinds of people in Bari360, and this policy treats them differently because their relationship with us is genuinely different:"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "Role"
            }
          ],
          [
            {
              "t": "text",
              "v": "How they get an account"
            }
          ],
          [
            {
              "t": "text",
              "v": "What they are to us"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "bold",
                "v": "Owner"
              },
              {
                "t": "text",
                "v": " (landlord)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Registers themselves"
              }
            ],
            [
              {
                "t": "text",
                "v": "Our direct customer"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Tenant"
              },
              {
                "t": "text",
                "v": " (resident)"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Created by their landlord"
              },
              {
                "t": "text",
                "v": ", logs in with a passcode the landlord gives them"
              }
            ],
            [
              {
                "t": "text",
                "v": "A person whose data our customer entered"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Staff"
              },
              {
                "t": "text",
                "v": " (caretaker, guard, cleaner)"
              }
            ],
            [
              {
                "t": "bold",
                "v": "No account at all"
              },
              {
                "t": "text",
                "v": " — they are a record their employer keeps"
              }
            ],
            [
              {
                "t": "text",
                "v": "A person whose data our customer entered"
              }
            ]
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "2. Who is responsible for your data (this section matters)"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "For an owner's own account data,"
          },
          {
            "t": "text",
            "v": " Bari360 is the data controller. We decide what we collect and why, and this policy governs it."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "For tenant and staff data,"
          },
          {
            "t": "text",
            "v": " the "
          },
          {
            "t": "bold",
            "v": "owner is the controller and Bari360 is only the processor."
          },
          {
            "t": "text",
            "v": " The landlord chooses what to record about you, enters it, and controls it. We store and process it on their instructions so that the service works."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Practically, this means:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "If you are a tenant or a staff member and you want your data corrected or deleted, ask your landlord or employer first."
            },
            {
              "t": "text",
              "v": " They are the person who entered it and the person who can change it."
            }
          ],
          [
            {
              "t": "text",
              "v": "If they will not act, or you cannot reach them, contact us at [GRIEVANCE CONTACT]. We will act where the law requires us to, but we may need to involve the owner, and we may not be able to delete records they are legally required to keep."
            }
          ],
          [
            {
              "t": "text",
              "v": "Bari360 does not sell, rent, or independently exploit tenant or staff data. We do not use it to market to you."
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "3. What we collect, why, and on what basis"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We collect only what the service needs to function. Nothing below is optional-but-collected-anyway; if a field is optional in the app, it is optional here."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.1 Owner account"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "What"
            }
          ],
          [
            {
              "t": "text",
              "v": "Why we take it"
            }
          ],
          [
            {
              "t": "text",
              "v": "What we use it for"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "Name"
              }
            ],
            [
              {
                "t": "text",
                "v": "Identifies you in the app and on receipts"
              }
            ],
            [
              {
                "t": "text",
                "v": "Displaying your account, addressing emails"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Email address"
              }
            ],
            [
              {
                "t": "text",
                "v": "It is your login and our only reliable way to reach you"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sign-in, password recovery, service and billing notices"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Password"
              }
            ],
            [
              {
                "t": "text",
                "v": "To secure the account"
              }
            ],
            [
              {
                "t": "text",
                "v": "Stored only as a salted hash by our authentication provider; we never see it"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Phone number (optional)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Support contact, and printed on receipts if you choose"
              }
            ],
            [
              {
                "t": "text",
                "v": "Contacting you about your account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Signature image (optional)"
              }
            ],
            [
              {
                "t": "text",
                "v": "You asked for it to appear on rent receipts"
              }
            ],
            [
              {
                "t": "text",
                "v": "Rendering receipts only"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Your message templates (WhatsApp receipt text, reminder text)"
              }
            ],
            [
              {
                "t": "text",
                "v": "You wrote them"
              }
            ],
            [
              {
                "t": "text",
                "v": "Pre-filling messages you send to your own tenants"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Legal basis:"
          },
          {
            "t": "text",
            "v": " performance of our contract with you, and our legitimate interest in operating and securing the service."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.2 Tenant record — entered by the landlord"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "What"
            }
          ],
          [
            {
              "t": "text",
              "v": "Why it is taken"
            }
          ],
          [
            {
              "t": "text",
              "v": "What it is used for"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "Name"
              }
            ],
            [
              {
                "t": "text",
                "v": "Identifies the tenancy"
              }
            ],
            [
              {
                "t": "text",
                "v": "Ledgers, receipts, notices"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Phone number"
              }
            ],
            [
              {
                "t": "bold",
                "v": "This is the tenant's login identity"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sign-in, and the number receipts are shared to"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Number of family members"
              }
            ],
            [
              {
                "t": "text",
                "v": "Occupancy record kept by landlords"
              }
            ],
            [
              {
                "t": "text",
                "v": "Property records"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "National ID (NID) number"
              }
            ],
            [
              {
                "t": "text",
                "v": "Standard tenancy verification in Bangladesh"
              }
            ],
            [
              {
                "t": "text",
                "v": "Identity record for the tenancy — see section 4"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Monthly rent, service charge, advance, rent due day, tenancy start date"
              }
            ],
            [
              {
                "t": "text",
                "v": "The commercial terms of the tenancy"
              }
            ],
            [
              {
                "t": "text",
                "v": "Generating invoices and statements"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Login passcode"
              }
            ],
            [
              {
                "t": "text",
                "v": "Lets the tenant sign in without an email address"
              }
            ],
            [
              {
                "t": "text",
                "v": "Stored only as a hash; shown to the landlord once, to hand over"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Legal basis:"
          },
          {
            "t": "text",
            "v": " the owner's contract with their tenant and their legitimate interest in managing the tenancy. "
          },
          {
            "t": "bold",
            "v": "The owner is responsible for having a lawful basis and the tenant's consent."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.3 Tenancy, billing and financial records"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Property name and address, flat number, occupancy status, service-charge breakdown (caretaker, security guard, lift maintenance, water, common electricity, common gas, dust collectors), rent invoices and their status, part-payments with date and method (cash / bKash / Nagad / bank / other), discounts, extra charges and remarks, rent revision history, and occupancy history."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " this is the core function of the product — recording what is owed, what was paid and when."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Note that "
          },
          {
            "t": "bold",
            "v": "rent revision history and past-occupancy records keep the tenant's name and phone number after the tenancy ends"
          },
          {
            "t": "text",
            "v": ", because they are historical records of the property. See section 10."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.4 Staff and salary — entered by the owner"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Name, phone, designation, assigned property, joining date, "
          },
          {
            "t": "bold",
            "v": "monthly salary"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "bold",
            "v": "NID number"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "bold",
            "v": "a scan of the NID document"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "bold",
            "v": "a photograph"
          },
          {
            "t": "text",
            "v": ", home address, notes, and each salary payment (amount, date, method)."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " owners asked to manage building staff and wage payments in one place. The NID number is encrypted at rest, exactly as a tenant's is — see section 4. The uploaded ID scan and photograph are files, so section 5 applies to them."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.5 Bookkeeping (optional paid module)"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Account names and types (cash / bank / mobile money), opening balances, income and expense entries with category, date, amount and note, and transfers between accounts."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " it is an optional bookkeeping feature the owner switched on."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.6 Documents and images"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Files an owner or tenant uploads: tenancy documents and deeds (PDF or image), maintenance-issue photos, staff NID scans and photos, the owner's signature, and support-ticket screenshots."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " so they are attached to the right tenancy or ticket. "
          },
          {
            "t": "bold",
            "v": "Please read section 5 — this is where our most important limitation is."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.7 Communications"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Notices and circulars, rent reminders and their schedules, maintenance requests and their text and attachments, resolution remarks, support tickets, and \"contact us\" enquiries (which include the name, email and phone you type into the form)."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " to deliver the message to the person it is meant for, and to answer you."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.8 Device and notification data"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "If you allow notifications, we store a push token for that device, its type (web or Android), your role, and — for browsers — the encryption keys the browser requires to receive push messages. We also store your notification-sound preference."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " without a token we cannot send you a notification. Tokens that stop working are deleted automatically."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.9 Technical and diagnostic data"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Presence:"
            },
            {
              "t": "text",
              "v": " while the app is open we record that your device is active — a device identifier generated on your device, your role, platform (web or Android), your browser/device user-agent string, and first/last seen times. This is what shows an administrator who is currently online."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Error logs:"
            },
            {
              "t": "text",
              "v": " when something goes wrong we record the error message and stack trace, the route and method, your user id and role, your email, "
            },
            {
              "t": "bold",
              "v": "your IP address"
            },
            {
              "t": "text",
              "v": ", your user-agent, and a reference code ("
            },
            {
              "t": "code",
              "v": "req_..."
            },
            {
              "t": "text",
              "v": ") that we show you so support can find the exact event."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Password-change history:"
            },
            {
              "t": "text",
              "v": " every password change records who did it, the method, and "
            },
            {
              "t": "bold",
              "v": "the IP address it was done from"
            },
            {
              "t": "text",
              "v": ". We also email the account holder with that time and IP — including when an administrator did it — so an account takeover cannot happen silently."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Rate limiting:"
            },
            {
              "t": "text",
              "v": " we count requests per IP address in memory to block abuse. This is not stored in our database."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " security, fraud prevention, and being able to diagnose a fault you report. "
          },
          {
            "t": "bold",
            "v": "Legal basis:"
          },
          {
            "t": "text",
            "v": " our legitimate interest in a secure, working service."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.10 Subscription and payment"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Your chosen plan, activation and expiry dates, plan history, and — for each manual payment you submit — "
          },
          {
            "t": "bold",
            "v": "the mobile number you paid from, the transaction ID, the amount"
          },
          {
            "t": "text",
            "v": ", a snapshot of your email, and the reviewing administrator's decision and notes."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Why:"
          },
          {
            "t": "text",
            "v": " we have to match your payment against our mobile-money statement by hand before activating a plan. See section 7 on what we do *not* do with payments."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.11 Analytics"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Google Analytics 4 / Google Tag Manager can be enabled by an administrator for the website and/or the Android app. "
          },
          {
            "t": "bold",
            "v": "It is switched off by default and no analytics IDs are configured out of the box."
          },
          {
            "t": "text",
            "v": " When it is on, Google receives standard analytics data — page views, approximate location derived from IP, device and browser information, and Google's own analytics cookies."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We do not push any custom events to Google. We never send Google your name, email, phone, NID, financial records or documents."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "There is currently no cookie/analytics consent banner."
          },
          {
            "t": "text",
            "v": " If you are in a jurisdiction that requires prior consent for analytics, do not use the service until we have published one; we will not enable analytics broadly for such users before that."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "4. National ID numbers — read this"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bangladesh NID numbers are sensitive, so we say plainly how we hold them:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Tenant and staff NID numbers are both encrypted at rest"
            },
            {
              "t": "text",
              "v": " using AES-256-GCM with a key held outside the database. An NID is decrypted "
            },
            {
              "t": "bold",
              "v": "only"
            },
            {
              "t": "text",
              "v": " for the landlord or employer who entered it. A tenant's NID is "
            },
            {
              "t": "bold",
              "v": "never"
            },
            {
              "t": "text",
              "v": " shown to the tenant in their own dashboard, and no NID is included in any notification or email or sent to any third party."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Uploaded ID document scans and staff photographs are not encrypted"
            },
            {
              "t": "text",
              "v": ", because they are files rather than database fields. They are protected by the unguessable address described in section 5 — please read it, because that protection has a real limit."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We do not use NID for identity verification against any government system. We do not share it with anyone."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "5. Uploaded files — an honest limitation"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Files you upload are stored at a randomly generated, unguessable address. "
          },
          {
            "t": "bold",
            "v": "That address is not itself password-protected — anyone who obtains the exact link can open the file, even if they are not signed in to Bari360."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "This affects tenancy documents, NID scans, staff photographs, signatures, maintenance photos and support attachments."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Do not forward these links to anyone you would not show the file to."
          },
          {
            "t": "text",
            "v": " We are migrating this storage to expiring, signed links, after which a link will stop working on its own."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "6. What we never collect"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Location."
            },
            {
              "t": "text",
              "v": " We do not request or collect GPS or precise location from any device."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Contacts, calendar, SMS, call logs, camera or microphone in the background."
            },
            {
              "t": "text",
              "v": " The app only opens a file picker or camera when you tap to attach a file."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Advertising identifiers."
            },
            {
              "t": "text",
              "v": " There is no advertising in Bari360 and no ad SDK."
            }
          ],
          [
            {
              "t": "bold",
              "v": "We never sell personal data, and we never share it with data brokers or advertisers."
            },
            {
              "t": "text",
              "v": " Not yours, not your tenants', not your staff's."
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "7. Money: what we do and do not do"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Bari360 does not process, hold, escrow or transfer rent."
          },
          {
            "t": "text",
            "v": " Rent moves directly between tenant and landlord, outside the app. When a tenant taps \"mark as sent\", that records a *claim* by the tenant; it is not a verified payment and we do not verify it."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "We are not a payment gateway and we are not integrated with bKash."
          },
          {
            "t": "text",
            "v": " Subscription payments are sent by you, out of band, to a mobile-money number we publish in the app, and an administrator matches them by hand. We store the sender number and transaction ID you type in. We never see or store your bKash PIN, your account balance, or your bank details."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "8. Who we share data with"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We use these service providers. Each receives only what it needs."
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "Provider"
            }
          ],
          [
            {
              "t": "text",
              "v": "What it receives"
            }
          ],
          [
            {
              "t": "text",
              "v": "Purpose"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "bold",
                "v": "Supabase"
              }
            ],
            [
              {
                "t": "text",
                "v": "The database, authentication and uploaded files — i.e. everything"
              }
            ],
            [
              {
                "t": "text",
                "v": "Hosting our data store"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Vercel"
              }
            ],
            [
              {
                "t": "text",
                "v": "Web requests, including IP addresses, in its server logs"
              }
            ],
            [
              {
                "t": "text",
                "v": "Hosting the application"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Brevo"
              }
            ],
            [
              {
                "t": "text",
                "v": "Recipient email address and name, and the message body"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sending account, password and plan emails"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Google (Firebase Cloud Messaging)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Android push token and the notification title/body"
              }
            ],
            [
              {
                "t": "text",
                "v": "Delivering Android notifications"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Browser push services"
              },
              {
                "t": "text",
                "v": " (Google, Mozilla, Apple, depending on your browser)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Your push endpoint and an encrypted payload"
              }
            ],
            [
              {
                "t": "text",
                "v": "Delivering browser notifications"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Google Analytics / Tag Manager"
              }
            ],
            [
              {
                "t": "text",
                "v": "Standard analytics data — "
              },
              {
                "t": "bold",
                "v": "only if an administrator has enabled it"
              }
            ],
            [
              {
                "t": "text",
                "v": "Understanding usage"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "GitHub"
              }
            ],
            [
              {
                "t": "text",
                "v": "Your device's IP and user-agent when it checks for or downloads an Android update"
              }
            ],
            [
              {
                "t": "text",
                "v": "Distributing the Android app"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "WhatsApp"
              }
            ],
            [
              {
                "t": "text",
                "v": "Only what you send yourself — see below"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sharing a receipt"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Mobile money provider"
              },
              {
                "t": "text",
                "v": " (bKash / Nagad / others)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Nothing from us — the payment happens outside Bari360"
              }
            ],
            [
              {
                "t": "text",
                "v": "Subscription payment"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "About WhatsApp:"
          },
          {
            "t": "text",
            "v": " we have no WhatsApp integration or data-sharing agreement. The app simply opens a "
          },
          {
            "t": "code",
            "v": "wa.me"
          },
          {
            "t": "text",
            "v": " link with the message text pre-filled. "
          },
          {
            "t": "bold",
            "v": "You"
          },
          {
            "t": "text",
            "v": " send the message from your own WhatsApp account, and WhatsApp's own privacy policy applies to it. Notification and receipt text can contain a tenant's name and a rent amount."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We may also disclose data where we are legally required to — a court order or lawful demand from a Bangladeshi authority — or where necessary to establish or defend a legal claim, or to protect someone's safety."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "If Bari360 is ever sold or merged, data may transfer to the acquirer, who would be bound by this policy until they lawfully publish a replacement."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "9. Cookies and local storage"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "We set no cookies of our own."
          },
          {
            "t": "text",
            "v": " Nothing on our side writes a cookie to your browser."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We use your browser's local storage — which stays on your device and is not transmitted with every request — for: your signed-in session, your theme choice, your language choice, a randomly generated device identifier for presence, your notification-sound setting, and a marker of which notices you have already seen. Signing out clears the session and our cached copies of your data."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "If an administrator enables Google Analytics, "
          },
          {
            "t": "bold",
            "v": "Google"
          },
          {
            "t": "text",
            "v": " sets its own cookies ("
          },
          {
            "t": "code",
            "v": "_ga"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "code",
            "v": "_ga_*"
          },
          {
            "t": "text",
            "v": ")."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "10. How long we keep data"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "Data"
            }
          ],
          [
            {
              "t": "text",
              "v": "Retention"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "Error and diagnostic logs (including IP and user-agent)"
              }
            ],
            [
              {
                "t": "bold",
                "v": "30 days"
              },
              {
                "t": "text",
                "v": ", then automatically deleted"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Owner account, tenants, properties, invoices, staff, bookkeeping, documents"
              }
            ],
            [
              {
                "t": "text",
                "v": "For as long as the account exists"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Past-occupancy and rent-revision records"
              }
            ],
            [
              {
                "t": "text",
                "v": "Kept as property history "
              },
              {
                "t": "bold",
                "v": "after the tenancy ends"
              },
              {
                "t": "text",
                "v": ", including the tenant's name and phone"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Password-change history (including IP)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Kept as a security audit record for the life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Push tokens"
              }
            ],
            [
              {
                "t": "text",
                "v": "Until the device unsubscribes or the token stops working, then deleted automatically"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "Payment submissions"
              }
            ],
            [
              {
                "t": "text",
                "v": "Kept as a financial record for the life of the account"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "When an account is deleted we purge the owner's tenants, properties, invoices, payments, staff, bookkeeping, documents, reminders, notices, tickets and devices across the database."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Two honest exceptions."
          },
          {
            "t": "text",
            "v": " That purge does "
          },
          {
            "t": "bold",
            "v": "not"
          },
          {
            "t": "text",
            "v": " currently remove (a) diagnostic logs, presence records and notification preferences — though logs expire on their own within 30 days — or (b) the "
          },
          {
            "t": "bold",
            "v": "files already uploaded to storage"
          },
          {
            "t": "text",
            "v": ", which remain until deleted separately. If you want your uploaded files removed, say so explicitly when you request deletion and we will remove them by hand."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "11. Your rights"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Wherever you are, we will honour the following. If you are in the EU/UK these are your GDPR rights; elsewhere we apply them as a matter of policy."
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Access"
            },
            {
              "t": "text",
              "v": " — a copy of the personal data we hold about you."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Rectification"
            },
            {
              "t": "text",
              "v": " — correction of anything inaccurate."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Erasure"
            },
            {
              "t": "text",
              "v": " — deletion, subject to records we must keep by law."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Restriction"
            },
            {
              "t": "text",
              "v": " — ask us to pause processing while a dispute is resolved."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Portability"
            },
            {
              "t": "text",
              "v": " — a machine-readable copy of data you provided."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Objection"
            },
            {
              "t": "text",
              "v": " — object to processing based on legitimate interests."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Withdraw consent"
            },
            {
              "t": "text",
              "v": " — where we relied on consent, including turning off notifications at any time in your device settings."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Complain"
            },
            {
              "t": "text",
              "v": " — to us at [GRIEVANCE CONTACT], or to your local data protection authority."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "How to exercise them today:"
          },
          {
            "t": "text",
            "v": " email [SUPPORT EMAIL] from the address on your account, or ask your landlord if you are a tenant or staff member (see section 2). We will respond within "
          },
          {
            "t": "bold",
            "v": "[30] days"
          },
          {
            "t": "text",
            "v": "."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Please be aware of two current limitations, stated plainly:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": true,
        "items": [
          [
            {
              "t": "bold",
              "v": "There is no self-service account deletion in the app."
            },
            {
              "t": "text",
              "v": " Deletion is performed by our administrators on request. We are building an in-app route."
            }
          ],
          [
            {
              "t": "bold",
              "v": "There is no automated data export."
            },
            {
              "t": "text",
              "v": " We fulfil portability requests manually."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Neither limitation reduces your rights — it only means the request goes through email rather than a button."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "12. Children"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 is not intended for anyone under 18 and we do not knowingly collect children's data. "
          },
          {
            "t": "bold",
            "v": "Owners must not enter a minor's National ID or photograph."
          },
          {
            "t": "text",
            "v": " If you believe a child's data is in the service, contact [GRIEVANCE CONTACT] and we will remove it."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "13. How we protect data"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "The database refuses all direct public access; every read and write goes through our authenticated application layer."
            }
          ],
          [
            {
              "t": "text",
              "v": "Tenant NID is encrypted at rest with AES-256-GCM (see section 4 for the staff exception)."
            }
          ],
          [
            {
              "t": "text",
              "v": "Passwords are hashed by our authentication provider; tenant passcodes are stored as a salted, deliberately slow hash, never in readable form."
            }
          ],
          [
            {
              "t": "text",
              "v": "Sign-in attempts, sign-ups, password-reset requests and general traffic are rate-limited to blunt brute-force and abuse."
            }
          ],
          [
            {
              "t": "text",
              "v": "Requests are size-capped, and identity headers presented by a client are discarded and re-derived from a verified token, so a client cannot claim to be someone else."
            }
          ],
          [
            {
              "t": "text",
              "v": "Password changes are audited and always notified to the account holder by email."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "No system is perfectly secure, and we do not claim otherwise. Section 5 describes a specific limitation we are working on. If you find a vulnerability, please report it to [SUPPORT EMAIL] rather than disclosing it publicly."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "14. Where your data is stored"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Our hosting, database and email providers operate data centres "
          },
          {
            "t": "bold",
            "v": "outside Bangladesh"
          },
          {
            "t": "text",
            "v": ". Using Bari360 involves transferring your data internationally to those providers, who process it under their own contractual and security commitments."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "15. Changes, and how to contact us"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We will update this policy as the product changes. When a change materially affects you we will raise the \"last updated\" date and tell you in the app. Continuing to use Bari360 after a change means you accept the updated policy."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Questions, requests or complaints:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Email:"
            },
            {
              "t": "text",
              "v": " [SUPPORT EMAIL]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Privacy / grievance contact:"
            },
            {
              "t": "text",
              "v": " [GRIEVANCE CONTACT]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Phone:"
            },
            {
              "t": "text",
              "v": " [SUPPORT PHONE]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Post:"
            },
            {
              "t": "text",
              "v": " [LEGAL ENTITY NAME], [REGISTERED ADDRESS]"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "See also the "
          },
          {
            "t": "link",
            "v": "Terms and Conditions",
            "href": "./TERMS_AND_CONDITIONS.en.md"
          },
          {
            "t": "text",
            "v": ", whose "
          },
          {
            "t": "bold",
            "v": "Data Storage Policy"
          },
          {
            "t": "text",
            "v": " section sets out field-by-field what is stored, where, and for how long."
          }
        ]
      }
    ]
  },
  "privacyBn": {
    "title": "বাড়ি৩৬০ — গোপনীয়তা নীতি (Privacy Policy)",
    "blocks": [
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কার্যকর তারিখ:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "সর্বশেষ হালনাগাদ:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "প্রযোজ্য:"
          },
          {
            "t": "text",
            "v": " "
          },
          {
            "t": "code",
            "v": "https://www.bari360.space"
          },
          {
            "t": "text",
            "v": " ঠিকানার Bari360 ওয়েব অ্যাপ্লিকেশন এবং Bari360 অ্যান্ড্রয়েড অ্যাপ্লিকেশন (প্যাকেজ "
          },
          {
            "t": "code",
            "v": "com.rentmaster.app"
          },
          {
            "t": "text",
            "v": ")।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই নীতি ইংরেজি ও বাংলা — দুই ভাষায় প্রকাশিত। "
          },
          {
            "t": "bold",
            "v": "ইংরেজি সংস্করণটিই চূড়ান্ত ও কর্তৃত্বপূর্ণ।"
          },
          {
            "t": "text",
            "v": " দুই সংস্করণের মধ্যে কোনো অমিল দেখা দিলে ইংরেজি লেখাই প্রযোজ্য হবে।"
          }
        ]
      },
      {
        "type": "hr"
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১. আমরা কারা"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 (\"বাড়ি৩৬০\", \"আমরা\") বাংলাদেশের বাড়িওয়ালা ও ভাড়াটিয়াদের জন্য একটি সম্পত্তি ও ভাড়া ব্যবস্থাপনা সেবা। এটি পরিচালনা করে:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "পরিচালনাকারী:"
            },
            {
              "t": "text",
              "v": " [LEGAL ENTITY NAME]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "নিবন্ধিত ঠিকানা:"
            },
            {
              "t": "text",
              "v": " [REGISTERED ADDRESS]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "নিবন্ধন / ট্রেড লাইসেন্স:"
            },
            {
              "t": "text",
              "v": " [TRADE LICENCE / REG. NO.]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ইমেইল:"
            },
            {
              "t": "text",
              "v": " [SUPPORT EMAIL]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ফোন:"
            },
            {
              "t": "text",
              "v": " [SUPPORT PHONE]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "গোপনীয়তা / অভিযোগ যোগাযোগ:"
            },
            {
              "t": "text",
              "v": " [GRIEVANCE CONTACT]"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360-তে তিন ধরনের ব্যবহারকারী আছেন। এই নীতিতে তাঁদের আলাদাভাবে দেখা হয়েছে, কারণ আমাদের সঙ্গে তাঁদের সম্পর্ক সত্যিই ভিন্ন:"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "ভূমিকা"
            }
          ],
          [
            {
              "t": "text",
              "v": "অ্যাকাউন্ট কীভাবে হয়"
            }
          ],
          [
            {
              "t": "text",
              "v": "আমাদের কাছে তিনি কে"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "bold",
                "v": "মালিক"
              },
              {
                "t": "text",
                "v": " (বাড়িওয়ালা)"
              }
            ],
            [
              {
                "t": "text",
                "v": "নিজে নিবন্ধন করেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "আমাদের সরাসরি গ্রাহক"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "ভাড়াটিয়া"
              }
            ],
            [
              {
                "t": "bold",
                "v": "বাড়িওয়ালা তৈরি করে দেন"
              },
              {
                "t": "text",
                "v": "; বাড়িওয়ালার দেওয়া পাসকোড দিয়ে লগইন করেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "যাঁর তথ্য আমাদের গ্রাহক প্রবেশ করিয়েছেন"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "কর্মী"
              },
              {
                "t": "text",
                "v": " (কেয়ারটেকার, দারোয়ান, পরিচ্ছন্নতাকর্মী)"
              }
            ],
            [
              {
                "t": "bold",
                "v": "কোনো অ্যাকাউন্টই নেই"
              },
              {
                "t": "text",
                "v": " — এটি নিয়োগকর্তার রাখা একটি রেকর্ড মাত্র"
              }
            ],
            [
              {
                "t": "text",
                "v": "যাঁর তথ্য আমাদের গ্রাহক প্রবেশ করিয়েছেন"
              }
            ]
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "২. আপনার তথ্যের দায়িত্ব কার (এই অংশটি গুরুত্বপূর্ণ)"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "মালিকের নিজের অ্যাকাউন্টের তথ্যের ক্ষেত্রে"
          },
          {
            "t": "text",
            "v": " Bari360 হলো ডেটা কন্ট্রোলার। কী নেব ও কেন নেব তা আমরা নির্ধারণ করি, এবং এই নীতি সেটি নিয়ন্ত্রণ করে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "ভাড়াটিয়া ও কর্মীর তথ্যের ক্ষেত্রে মালিকই কন্ট্রোলার, আর Bari360 কেবল প্রসেসর।"
          },
          {
            "t": "text",
            "v": " বাড়িওয়ালা ঠিক করেন আপনার সম্পর্কে কী লিপিবদ্ধ হবে, তিনিই তা প্রবেশ করান এবং তিনিই তা নিয়ন্ত্রণ করেন। সেবাটি চালু রাখার জন্য আমরা তাঁর নির্দেশে সেই তথ্য সংরক্ষণ ও প্রক্রিয়াকরণ করি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "বাস্তবে এর অর্থ:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "আপনি ভাড়াটিয়া বা কর্মী হয়ে থাকলে এবং আপনার তথ্য সংশোধন বা মুছে ফেলতে চাইলে প্রথমে আপনার বাড়িওয়ালা বা নিয়োগকর্তার সঙ্গে যোগাযোগ করুন।"
            },
            {
              "t": "text",
              "v": " তিনিই তথ্যটি প্রবেশ করিয়েছেন এবং তিনিই তা পরিবর্তন করতে পারেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "তিনি ব্যবস্থা না নিলে বা তাঁর সঙ্গে যোগাযোগ করতে না পারলে [GRIEVANCE CONTACT]-এ আমাদের জানান। আইন যেখানে বাধ্য করে সেখানে আমরা ব্যবস্থা নেব, তবে মালিককে যুক্ত করতে হতে পারে এবং আইনত সংরক্ষণ বাধ্যতামূলক এমন রেকর্ড আমরা মুছতে না-ও পারি।"
            }
          ],
          [
            {
              "t": "text",
              "v": "Bari360 ভাড়াটিয়া বা কর্মীর তথ্য বিক্রি বা ভাড়া দেয় না, স্বাধীনভাবে ব্যবহারও করে না। আপনাকে বিপণনের জন্য আমরা এই তথ্য ব্যবহার করি না।"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৩. আমরা কী নিই, কেন নিই, এবং কোন ভিত্তিতে"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সেবাটি চালু রাখতে যা প্রয়োজন কেবল তা-ই আমরা নিই। অ্যাপে যে ঘর ঐচ্ছিক, এখানেও তা ঐচ্ছিক।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.১ মালিকের অ্যাকাউন্ট"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "কী"
            }
          ],
          [
            {
              "t": "text",
              "v": "কেন নিই"
            }
          ],
          [
            {
              "t": "text",
              "v": "কী কাজে লাগে"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "নাম"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাপে আপনাকে ও রসিদে আপনাকে শনাক্ত করে"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট প্রদর্শন, ইমেইলে সম্বোধন"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "ইমেইল ঠিকানা"
              }
            ],
            [
              {
                "t": "text",
                "v": "এটিই আপনার লগইন এবং আপনার সঙ্গে যোগাযোগের একমাত্র নির্ভরযোগ্য উপায়"
              }
            ],
            [
              {
                "t": "text",
                "v": "সাইন-ইন, পাসওয়ার্ড পুনরুদ্ধার, সেবা ও বিলিং বার্তা"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "পাসওয়ার্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট সুরক্ষিত রাখতে"
              }
            ],
            [
              {
                "t": "text",
                "v": "কেবল হ্যাশ আকারে সংরক্ষিত হয়; আমরা কখনো দেখি না"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "ফোন নম্বর (ঐচ্ছিক)"
              }
            ],
            [
              {
                "t": "text",
                "v": "সহায়তার যোগাযোগ, এবং আপনি চাইলে রসিদে ছাপা হয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট বিষয়ে যোগাযোগ"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "স্বাক্ষরের ছবি (ঐচ্ছিক)"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনি চেয়েছেন এটি ভাড়ার রসিদে থাকুক"
              }
            ],
            [
              {
                "t": "text",
                "v": "কেবল রসিদ তৈরিতে"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "আপনার বার্তার টেমপ্লেট (WhatsApp রসিদ, রিমাইন্ডার)"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনি নিজে লিখেছেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনার নিজের ভাড়াটিয়াদের পাঠানো বার্তা আগে থেকে পূরণ করতে"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আইনগত ভিত্তি:"
          },
          {
            "t": "text",
            "v": " আপনার সঙ্গে আমাদের চুক্তি পালন এবং সেবা পরিচালনা ও সুরক্ষায় আমাদের বৈধ স্বার্থ।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.২ ভাড়াটিয়ার রেকর্ড — বাড়িওয়ালা প্রবেশ করান"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "কী"
            }
          ],
          [
            {
              "t": "text",
              "v": "কেন নেওয়া হয়"
            }
          ],
          [
            {
              "t": "text",
              "v": "কী কাজে লাগে"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "নাম"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া চুক্তি শনাক্ত করে"
              }
            ],
            [
              {
                "t": "text",
                "v": "খতিয়ান, রসিদ, নোটিশ"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "ফোন নম্বর"
              }
            ],
            [
              {
                "t": "bold",
                "v": "এটিই ভাড়াটিয়ার লগইন পরিচয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "সাইন-ইন, এবং যে নম্বরে রসিদ পাঠানো হয়"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "পরিবারের সদস্য সংখ্যা"
              }
            ],
            [
              {
                "t": "text",
                "v": "বাড়িওয়ালাদের রাখা বসবাসের রেকর্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "সম্পত্তির নথি"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "জাতীয় পরিচয়পত্র (NID) নম্বর"
              }
            ],
            [
              {
                "t": "text",
                "v": "বাংলাদেশে ভাড়া চুক্তির প্রচলিত যাচাই"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া চুক্তির পরিচয় রেকর্ড — দেখুন ধারা ৪"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "মাসিক ভাড়া, সার্ভিস চার্জ, অগ্রিম, ভাড়ার তারিখ, শুরুর তারিখ"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া চুক্তির বাণিজ্যিক শর্ত"
              }
            ],
            [
              {
                "t": "text",
                "v": "চালান ও হিসাব তৈরি"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "লগইন পাসকোড"
              }
            ],
            [
              {
                "t": "text",
                "v": "ইমেইল ছাড়াই ভাড়াটিয়াকে লগইনের সুযোগ দেয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "কেবল হ্যাশ আকারে সংরক্ষিত; বাড়িওয়ালাকে একবারই দেখানো হয়"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আইনগত ভিত্তি:"
          },
          {
            "t": "text",
            "v": " ভাড়াটিয়ার সঙ্গে মালিকের চুক্তি এবং ভাড়া ব্যবস্থাপনায় তাঁর বৈধ স্বার্থ। "
          },
          {
            "t": "bold",
            "v": "আইনগত ভিত্তি ও ভাড়াটিয়ার সম্মতি থাকার দায়িত্ব মালিকের।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৩ ভাড়া, বিলিং ও আর্থিক রেকর্ড"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সম্পত্তির নাম ও ঠিকানা, ফ্ল্যাট নম্বর, খালি/ভাড়া অবস্থা, সার্ভিস চার্জের বিভাজন (কেয়ারটেকার, নিরাপত্তা প্রহরী, লিফট রক্ষণাবেক্ষণ, পানি, সাধারণ বিদ্যুৎ, সাধারণ গ্যাস, ময়লা সংগ্রহ), ভাড়ার চালান ও তার অবস্থা, তারিখ ও মাধ্যমসহ আংশিক পরিশোধ (নগদ / বিকাশ / নগদ / ব্যাংক / অন্যান্য), ছাড়, অতিরিক্ত চার্জ ও মন্তব্য, ভাড়া পরিবর্তনের ইতিহাস এবং বসবাসের ইতিহাস।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " কে কত টাকা পাওনা, কখন কত পরিশোধ হলো — এটিই পণ্যটির মূল কাজ।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "লক্ষ্য করুন, "
          },
          {
            "t": "bold",
            "v": "ভাড়া পরিবর্তনের ইতিহাস ও পূর্বের বসবাসের রেকর্ডে ভাড়া চুক্তি শেষ হওয়ার পরেও ভাড়াটিয়ার নাম ও ফোন নম্বর থেকে যায়"
          },
          {
            "t": "text",
            "v": ", কারণ এগুলো সম্পত্তির ঐতিহাসিক নথি। দেখুন ধারা ১০।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৪ কর্মী ও বেতন — মালিক প্রবেশ করান"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "নাম, ফোন, পদবি, নির্ধারিত সম্পত্তি, যোগদানের তারিখ, "
          },
          {
            "t": "bold",
            "v": "মাসিক বেতন"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "bold",
            "v": "NID নম্বর"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "bold",
            "v": "NID নথির স্ক্যান"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "bold",
            "v": "ছবি"
          },
          {
            "t": "text",
            "v": ", বাসার ঠিকানা, মন্তব্য এবং প্রতিটি বেতন পরিশোধ (পরিমাণ, তারিখ, মাধ্যম)।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " মালিকেরা ভবনের কর্মী ও মজুরি এক জায়গায় ব্যবস্থাপনার সুবিধা চেয়েছেন। NID নম্বর সংরক্ষণে এনক্রিপ্ট করা থাকে, ঠিক ভাড়াটিয়ার মতোই — দেখুন ধারা ৪। আপলোড করা পরিচয়পত্রের স্ক্যান ও ছবি ফাইল, তাই সেগুলোর ক্ষেত্রে ধারা ৫ প্রযোজ্য।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৫ হিসাবরক্ষণ (ঐচ্ছিক সবেতন মডিউল)"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "হিসাবের নাম ও ধরন (নগদ / ব্যাংক / মোবাইল ব্যাংকিং), প্রারম্ভিক জের, শ্রেণি-তারিখ-পরিমাণ-মন্তব্যসহ আয় ও ব্যয়ের এন্ট্রি, এবং হিসাবের মধ্যে স্থানান্তর।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " এটি একটি ঐচ্ছিক হিসাবরক্ষণ সুবিধা, যা মালিক নিজে চালু করেছেন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৬ নথি ও ছবি"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "মালিক বা ভাড়াটিয়ার আপলোড করা ফাইল: ভাড়ার নথি ও দলিল (PDF বা ছবি), মেরামতের ছবি, কর্মীর NID স্ক্যান ও ছবি, মালিকের স্বাক্ষর এবং সাপোর্ট টিকিটের স্ক্রিনশট।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " যাতে সেগুলো সঠিক ভাড়া চুক্তি বা টিকিটের সঙ্গে যুক্ত থাকে। "
          },
          {
            "t": "bold",
            "v": "অনুগ্রহ করে ধারা ৫ পড়ুন — আমাদের সবচেয়ে গুরুত্বপূর্ণ সীমাবদ্ধতাটি সেখানে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৭ যোগাযোগ"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "নোটিশ ও সার্কুলার, ভাড়ার রিমাইন্ডার ও সময়সূচি, মেরামতের অনুরোধ ও তার বিবরণ ও সংযুক্তি, সমাধানের মন্তব্য, সাপোর্ট টিকিট এবং \"যোগাযোগ করুন\" অনুসন্ধান (যেখানে আপনি নাম, ইমেইল ও ফোন লেখেন)।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " বার্তাটি সঠিক ব্যক্তির কাছে পৌঁছে দিতে এবং আপনাকে উত্তর দিতে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৮ ডিভাইস ও নোটিফিকেশন তথ্য"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনি নোটিফিকেশনের অনুমতি দিলে আমরা সেই ডিভাইসের একটি পুশ টোকেন, তার ধরন (ওয়েব বা অ্যান্ড্রয়েড), আপনার ভূমিকা এবং — ব্রাউজারের ক্ষেত্রে — পুশ বার্তা গ্রহণের জন্য ব্রাউজারের প্রয়োজনীয় এনক্রিপশন কী সংরক্ষণ করি। আপনার নোটিফিকেশন সাউন্ডের পছন্দও সংরক্ষণ করি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " টোকেন ছাড়া আপনাকে নোটিফিকেশন পাঠানো সম্ভব নয়। যে টোকেন কাজ করা বন্ধ করে দেয়, তা স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৯ কারিগরি ও ডায়াগনস্টিক তথ্য"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "উপস্থিতি:"
            },
            {
              "t": "text",
              "v": " অ্যাপ খোলা থাকা অবস্থায় আমরা আপনার ডিভাইস সক্রিয় আছে তা লিপিবদ্ধ করি — আপনার ডিভাইসে তৈরি একটি শনাক্তকারী, আপনার ভূমিকা, প্ল্যাটফর্ম (ওয়েব বা অ্যান্ড্রয়েড), আপনার ব্রাউজার/ডিভাইসের user-agent এবং প্রথম ও সর্বশেষ দেখা সময়। এর মাধ্যমেই প্রশাসক দেখতে পান কে এখন অনলাইনে আছেন।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ত্রুটির লগ:"
            },
            {
              "t": "text",
              "v": " কিছু ভুল হলে আমরা ত্রুটির বার্তা ও স্ট্যাক ট্রেস, রুট ও মেথড, আপনার ইউজার আইডি ও ভূমিকা, আপনার ইমেইল, "
            },
            {
              "t": "bold",
              "v": "আপনার আইপি ঠিকানা"
            },
            {
              "t": "text",
              "v": ", user-agent এবং একটি রেফারেন্স কোড ("
            },
            {
              "t": "code",
              "v": "req_..."
            },
            {
              "t": "text",
              "v": ") সংরক্ষণ করি — কোডটি আপনাকে দেখানো হয় যাতে সাপোর্ট সঠিক ঘটনাটি খুঁজে পায়।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "পাসওয়ার্ড পরিবর্তনের ইতিহাস:"
            },
            {
              "t": "text",
              "v": " প্রতিটি পাসওয়ার্ড পরিবর্তনে কে করেছেন, কোন পদ্ধতিতে এবং "
            },
            {
              "t": "bold",
              "v": "কোন আইপি ঠিকানা থেকে"
            },
            {
              "t": "text",
              "v": " তা লিপিবদ্ধ হয়। সেই সময় ও আইপিসহ অ্যাকাউন্টধারীকে ইমেইলও করা হয় — এমনকি প্রশাসক করলেও — যাতে কেউ নীরবে অ্যাকাউন্ট দখল করতে না পারে।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "রেট লিমিটিং:"
            },
            {
              "t": "text",
              "v": " অপব্যবহার ঠেকাতে আমরা প্রতি আইপি অনুযায়ী অনুরোধ গণনা করি (মেমরিতে)। এটি আমাদের ডেটাবেসে সংরক্ষিত হয় না।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " নিরাপত্তা, প্রতারণা প্রতিরোধ এবং আপনার জানানো ত্রুটি নির্ণয়। "
          },
          {
            "t": "bold",
            "v": "আইনগত ভিত্তি:"
          },
          {
            "t": "text",
            "v": " নিরাপদ ও কার্যকর সেবা পরিচালনায় আমাদের বৈধ স্বার্থ।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.১০ সাবস্ক্রিপশন ও পেমেন্ট"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনার নির্বাচিত প্ল্যান, চালু ও মেয়াদ শেষের তারিখ, প্ল্যানের ইতিহাস এবং আপনার জমা দেওয়া প্রতিটি ম্যানুয়াল পেমেন্টের জন্য — "
          },
          {
            "t": "bold",
            "v": "যে মোবাইল নম্বর থেকে পাঠিয়েছেন, লেনদেন আইডি, পরিমাণ"
          },
          {
            "t": "text",
            "v": ", আপনার ইমেইলের একটি অনুলিপি এবং পর্যালোচনাকারী প্রশাসকের সিদ্ধান্ত ও মন্তব্য।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কেন:"
          },
          {
            "t": "text",
            "v": " প্ল্যান চালু করার আগে আমাদের মোবাইল ব্যাংকিং স্টেটমেন্টের সঙ্গে আপনার পেমেন্ট হাতে মিলিয়ে দেখতে হয়। পেমেন্ট নিয়ে আমরা কী "
          },
          {
            "t": "bold",
            "v": "করি না"
          },
          {
            "t": "text",
            "v": ", তা ধারা ৭-এ আছে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.১১ অ্যানালিটিক্স"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "প্রশাসক চাইলে ওয়েবসাইট ও/অথবা অ্যান্ড্রয়েড অ্যাপে Google Analytics 4 / Google Tag Manager চালু করতে পারেন। "
          },
          {
            "t": "bold",
            "v": "এটি ডিফল্টভাবে বন্ধ থাকে এবং কোনো অ্যানালিটিক্স আইডি আগে থেকে বসানো নেই।"
          },
          {
            "t": "text",
            "v": " চালু থাকলে Google সাধারণ অ্যানালিটিক্স তথ্য পায় — পেজ ভিউ, আইপি থেকে অনুমিত আনুমানিক অবস্থান, ডিভাইস ও ব্রাউজারের তথ্য এবং Google-এর নিজস্ব অ্যানালিটিক্স কুকি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা Google-এ কোনো কাস্টম ইভেন্ট পাঠাই না। আপনার নাম, ইমেইল, ফোন, NID, আর্থিক রেকর্ড বা নথি আমরা কখনোই Google-কে পাঠাই না।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "বর্তমানে কোনো কুকি/অ্যানালিটিক্স সম্মতি ব্যানার নেই।"
          },
          {
            "t": "text",
            "v": " আপনি যদি এমন কোনো অঞ্চলে থাকেন যেখানে অ্যানালিটিক্সের জন্য আগাম সম্মতি বাধ্যতামূলক, তাহলে আমরা ব্যানার প্রকাশ না করা পর্যন্ত সেবাটি ব্যবহার করবেন না; তার আগে আমরা এমন ব্যবহারকারীদের জন্য ব্যাপকভাবে অ্যানালিটিক্স চালু করব না।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৪. জাতীয় পরিচয়পত্র নম্বর — এটি পড়ুন"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "বাংলাদেশের NID নম্বর সংবেদনশীল তথ্য, তাই আমরা কীভাবে তা রাখি স্পষ্ট করে বলছি:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "ভাড়াটিয়া ও কর্মী — দুজনেরই NID নম্বর সংরক্ষণের সময় এনক্রিপ্ট করা থাকে"
            },
            {
              "t": "text",
              "v": " (AES-256-GCM), এবং চাবিটি ডেটাবেসের বাইরে রাখা। যে বাড়িওয়ালা বা নিয়োগকর্তা এটি প্রবেশ করিয়েছেন "
            },
            {
              "t": "bold",
              "v": "কেবল তাঁর জন্যই"
            },
            {
              "t": "text",
              "v": " এটি ডিক্রিপ্ট হয়। ভাড়াটিয়ার নিজের ড্যাশবোর্ডে তাঁর NID "
            },
            {
              "t": "bold",
              "v": "কখনোই"
            },
            {
              "t": "text",
              "v": " দেখানো হয় না, এবং কোনো NID কোনো নোটিফিকেশন বা ইমেইলে থাকে না বা কোনো তৃতীয় পক্ষকে পাঠানো হয় না।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "আপলোড করা পরিচয়পত্রের স্ক্যান ও কর্মীর ছবি এনক্রিপ্ট করা নয়"
            },
            {
              "t": "text",
              "v": ", কারণ সেগুলো ডেটাবেসের ঘর নয়, ফাইল। ধারা ৫-এ বর্ণিত অনুমান-অযোগ্য ঠিকানাই সেগুলোর সুরক্ষা — অনুগ্রহ করে সেটি পড়ুন, কারণ সেই সুরক্ষার একটি বাস্তব সীমা আছে।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা কোনো সরকারি ব্যবস্থার সঙ্গে পরিচয় যাচাইয়ে NID ব্যবহার করি না। কারও সঙ্গে এটি শেয়ার করি না।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৫. আপলোড করা ফাইল — একটি সৎ সীমাবদ্ধতা"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনার আপলোড করা ফাইল একটি এলোমেলোভাবে তৈরি, অনুমান-অযোগ্য ঠিকানায় সংরক্ষিত হয়। "
          },
          {
            "t": "bold",
            "v": "কিন্তু সেই ঠিকানাটি নিজে পাসওয়ার্ড-সুরক্ষিত নয় — যিনি সঠিক লিংকটি পেয়ে যাবেন, তিনি Bari360-তে সাইন ইন না করেও ফাইলটি খুলতে পারবেন।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এটি ভাড়ার নথি, NID স্ক্যান, কর্মীর ছবি, স্বাক্ষর, মেরামতের ছবি ও সাপোর্ট সংযুক্তির ক্ষেত্রে প্রযোজ্য।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "যাঁকে ফাইলটি দেখাতে চান না, তাঁকে এই লিংক পাঠাবেন না।"
          },
          {
            "t": "text",
            "v": " আমরা এই সংরক্ষণব্যবস্থাকে মেয়াদউত্তীর্ণ হওয়া, স্বাক্ষরিত লিংকে স্থানান্তর করছি; এরপর লিংক নিজে থেকেই অকার্যকর হয়ে যাবে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৬. আমরা যা কখনোই সংগ্রহ করি না"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "অবস্থান।"
            },
            {
              "t": "text",
              "v": " কোনো ডিভাইস থেকে GPS বা নির্দিষ্ট অবস্থান আমরা চাই না, সংগ্রহও করি না।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "কন্টাক্ট, ক্যালেন্ডার, এসএমএস, কল লগ, বা পটভূমিতে ক্যামেরা/মাইক্রোফোন।"
            },
            {
              "t": "text",
              "v": " আপনি সংযুক্তির জন্য ট্যাপ করলে তবেই অ্যাপ ফাইল পিকার বা ক্যামেরা খোলে।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "বিজ্ঞাপনের শনাক্তকারী।"
            },
            {
              "t": "text",
              "v": " Bari360-তে কোনো বিজ্ঞাপন নেই, কোনো বিজ্ঞাপন SDK নেই।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "আমরা কখনোই ব্যক্তিগত তথ্য বিক্রি করি না, ডেটা ব্রোকার বা বিজ্ঞাপনদাতার সঙ্গে শেয়ার করি না।"
            },
            {
              "t": "text",
              "v": " আপনার নয়, আপনার ভাড়াটিয়ার নয়, আপনার কর্মীরও নয়।"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৭. টাকা: আমরা কী করি আর কী করি না"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Bari360 ভাড়ার টাকা প্রক্রিয়া, সংরক্ষণ, জিম্মায় রাখা বা স্থানান্তর করে না।"
          },
          {
            "t": "text",
            "v": " ভাড়া সরাসরি ভাড়াটিয়া ও বাড়িওয়ালার মধ্যে, অ্যাপের বাইরে লেনদেন হয়। ভাড়াটিয়া \"পাঠানো হয়েছে\" চিহ্নিত করলে তা ভাড়াটিয়ার একটি *দাবি* মাত্র; এটি যাচাইকৃত পেমেন্ট নয় এবং আমরা তা যাচাই করি না।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আমরা পেমেন্ট গেটওয়ে নই এবং বিকাশের সঙ্গে সংযুক্ত নই।"
          },
          {
            "t": "text",
            "v": " সাবস্ক্রিপশনের টাকা আপনি নিজে, অ্যাপের বাইরে, আমাদের প্রকাশিত মোবাইল ব্যাংকিং নম্বরে পাঠান এবং একজন প্রশাসক তা হাতে মিলিয়ে দেখেন। আপনার লেখা প্রেরকের নম্বর ও লেনদেন আইডি আমরা সংরক্ষণ করি। আপনার বিকাশ পিন, ব্যালান্স বা ব্যাংকের তথ্য আমরা কখনো দেখি না, সংরক্ষণও করি না।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৮. আমরা কাদের সঙ্গে তথ্য শেয়ার করি"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা নিচের সেবাদাতাদের ব্যবহার করি। প্রত্যেকে কেবল প্রয়োজনীয়টুকুই পায়।"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "সেবাদাতা"
            }
          ],
          [
            {
              "t": "text",
              "v": "কী পায়"
            }
          ],
          [
            {
              "t": "text",
              "v": "উদ্দেশ্য"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "bold",
                "v": "Supabase"
              }
            ],
            [
              {
                "t": "text",
                "v": "ডেটাবেস, অথেনটিকেশন ও আপলোড করা ফাইল — অর্থাৎ সবকিছু"
              }
            ],
            [
              {
                "t": "text",
                "v": "আমাদের ডেটা সংরক্ষণ"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Vercel"
              }
            ],
            [
              {
                "t": "text",
                "v": "সার্ভার লগে ওয়েব অনুরোধ, আইপি ঠিকানাসহ"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাপ্লিকেশন হোস্টিং"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Brevo"
              }
            ],
            [
              {
                "t": "text",
                "v": "প্রাপকের ইমেইল ঠিকানা ও নাম, এবং বার্তার বিষয়বস্তু"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট, পাসওয়ার্ড ও প্ল্যান সংক্রান্ত ইমেইল"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Google (Firebase Cloud Messaging)"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যান্ড্রয়েড পুশ টোকেন এবং নোটিফিকেশনের শিরোনাম/বিষয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যান্ড্রয়েড নোটিফিকেশন পৌঁছে দেওয়া"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "ব্রাউজার পুশ সেবা"
              },
              {
                "t": "text",
                "v": " (ব্রাউজার অনুযায়ী Google, Mozilla, Apple)"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনার পুশ এন্ডপয়েন্ট ও একটি এনক্রিপ্টেড পেলোড"
              }
            ],
            [
              {
                "t": "text",
                "v": "ব্রাউজার নোটিফিকেশন পৌঁছে দেওয়া"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Google Analytics / Tag Manager"
              }
            ],
            [
              {
                "t": "text",
                "v": "সাধারণ অ্যানালিটিক্স তথ্য — "
              },
              {
                "t": "bold",
                "v": "কেবল প্রশাসক চালু করলে"
              }
            ],
            [
              {
                "t": "text",
                "v": "ব্যবহার বোঝা"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "GitHub"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যান্ড্রয়েড আপডেট খোঁজা বা নামানোর সময় ডিভাইসের আইপি ও user-agent"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যান্ড্রয়েড অ্যাপ বিতরণ"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "WhatsApp"
              }
            ],
            [
              {
                "t": "text",
                "v": "কেবল আপনি নিজে যা পাঠান — নিচে দেখুন"
              }
            ],
            [
              {
                "t": "text",
                "v": "রসিদ শেয়ার করা"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "মোবাইল ব্যাংকিং সেবা"
              },
              {
                "t": "text",
                "v": " (বিকাশ / নগদ / অন্যান্য)"
              }
            ],
            [
              {
                "t": "text",
                "v": "আমাদের কাছ থেকে কিছুই নয় — লেনদেন Bari360-এর বাইরে হয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "সাবস্ক্রিপশন পেমেন্ট"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "WhatsApp প্রসঙ্গে:"
          },
          {
            "t": "text",
            "v": " আমাদের কোনো WhatsApp ইন্টিগ্রেশন বা তথ্য-বিনিময় চুক্তি নেই। অ্যাপটি কেবল বার্তা আগে থেকে লেখা অবস্থায় একটি "
          },
          {
            "t": "code",
            "v": "wa.me"
          },
          {
            "t": "text",
            "v": " লিংক খোলে। "
          },
          {
            "t": "bold",
            "v": "আপনি নিজে"
          },
          {
            "t": "text",
            "v": " আপনার নিজের WhatsApp অ্যাকাউন্ট থেকে বার্তাটি পাঠান, এবং তাতে WhatsApp-এর নিজস্ব গোপনীয়তা নীতি প্রযোজ্য হয়। নোটিফিকেশন ও রসিদের লেখায় ভাড়াটিয়ার নাম ও ভাড়ার অঙ্ক থাকতে পারে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আইনত বাধ্য হলে — বাংলাদেশের কোনো কর্তৃপক্ষের আদালতের আদেশ বা বৈধ দাবিতে — অথবা কোনো আইনি দাবি প্রতিষ্ঠা বা প্রতিরক্ষায়, কিংবা কারও নিরাপত্তা রক্ষায় প্রয়োজন হলে আমরা তথ্য প্রকাশ করতে পারি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 কখনো বিক্রি বা একীভূত হলে তথ্য ক্রেতার কাছে হস্তান্তরিত হতে পারে; তাঁরা বৈধভাবে নতুন নীতি প্রকাশ না করা পর্যন্ত এই নীতি মেনে চলতে বাধ্য থাকবেন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৯. কুকি ও লোকাল স্টোরেজ"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আমরা নিজেরা কোনো কুকি বসাই না।"
          },
          {
            "t": "text",
            "v": " আমাদের দিক থেকে কিছুই আপনার ব্রাউজারে কুকি লেখে না।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা আপনার ব্রাউজারের লোকাল স্টোরেজ ব্যবহার করি — যা আপনার ডিভাইসেই থাকে এবং প্রতিটি অনুরোধের সঙ্গে পাঠানো হয় না — এসবের জন্য: আপনার সাইন-ইন সেশন, থিমের পছন্দ, ভাষার পছন্দ, উপস্থিতির জন্য এলোমেলোভাবে তৈরি একটি ডিভাইস শনাক্তকারী, নোটিফিকেশন সাউন্ডের সেটিং এবং কোন নোটিশগুলো আপনি ইতিমধ্যে দেখেছেন তার চিহ্ন। সাইন আউট করলে সেশন ও আপনার তথ্যের ক্যাশ করা অনুলিপি মুছে যায়।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "প্রশাসক Google Analytics চালু করলে "
          },
          {
            "t": "bold",
            "v": "Google"
          },
          {
            "t": "text",
            "v": " তার নিজস্ব কুকি ("
          },
          {
            "t": "code",
            "v": "_ga"
          },
          {
            "t": "text",
            "v": ", "
          },
          {
            "t": "code",
            "v": "_ga_*"
          },
          {
            "t": "text",
            "v": ") বসায়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১০. আমরা কত দিন তথ্য রাখি"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "তথ্য"
            }
          ],
          [
            {
              "t": "text",
              "v": "সংরক্ষণকাল"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "ত্রুটি ও ডায়াগনস্টিক লগ (আইপি ও user-agent সহ)"
              }
            ],
            [
              {
                "t": "bold",
                "v": "30 দিন"
              },
              {
                "t": "text",
                "v": ", এরপর স্বয়ংক্রিয়ভাবে মুছে যায়"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "মালিকের অ্যাকাউন্ট, ভাড়াটিয়া, সম্পত্তি, চালান, কর্মী, হিসাব, নথি"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট যত দিন থাকে"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "পূর্বের বসবাস ও ভাড়া পরিবর্তনের রেকর্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া চুক্তি শেষ হওয়ার "
              },
              {
                "t": "bold",
                "v": "পরেও"
              },
              {
                "t": "text",
                "v": " সম্পত্তির ইতিহাস হিসেবে থাকে, ভাড়াটিয়ার নাম ও ফোনসহ"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "পাসওয়ার্ড পরিবর্তনের ইতিহাস (আইপিসহ)"
              }
            ],
            [
              {
                "t": "text",
                "v": "নিরাপত্তা নিরীক্ষার রেকর্ড হিসেবে অ্যাকাউন্টের আয়ুষ্কাল পর্যন্ত"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "পুশ টোকেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "ডিভাইস আনসাবস্ক্রাইব না করা বা টোকেন অকার্যকর না হওয়া পর্যন্ত, এরপর স্বয়ংক্রিয়ভাবে মুছে যায়"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "পেমেন্ট জমা"
              }
            ],
            [
              {
                "t": "text",
                "v": "আর্থিক রেকর্ড হিসেবে অ্যাকাউন্টের আয়ুষ্কাল পর্যন্ত"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "অ্যাকাউন্ট মুছে ফেলার সময় আমরা মালিকের ভাড়াটিয়া, সম্পত্তি, চালান, পেমেন্ট, কর্মী, হিসাব, নথি, রিমাইন্ডার, নোটিশ, টিকিট ও ডিভাইস — সব ডেটাবেস জুড়ে মুছে ফেলি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "দুটি সৎ ব্যতিক্রম।"
          },
          {
            "t": "text",
            "v": " সেই মুছে ফেলা বর্তমানে (ক) ডায়াগনস্টিক লগ, উপস্থিতির রেকর্ড ও নোটিফিকেশন পছন্দ — যদিও লগ 30 দিনের মধ্যে নিজে থেকেই মুছে যায় — এবং (খ) "
          },
          {
            "t": "bold",
            "v": "ইতিমধ্যে স্টোরেজে আপলোড করা ফাইলগুলো"
          },
          {
            "t": "text",
            "v": " সরায় না; সেগুলো আলাদাভাবে না মোছা পর্যন্ত থেকে যায়। আপনার আপলোড করা ফাইল মুছতে চাইলে মুছে ফেলার অনুরোধে "
          },
          {
            "t": "bold",
            "v": "স্পষ্টভাবে তা উল্লেখ করুন"
          },
          {
            "t": "text",
            "v": ", আমরা হাতে করে সরিয়ে দেব।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১১. আপনার অধিকার"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনি যেখানেই থাকুন, নিচের অধিকারগুলো আমরা রক্ষা করব। আপনি EU/UK-তে থাকলে এগুলো আপনার GDPR অধিকার; অন্যত্র আমরা নীতিগতভাবে এগুলো প্রয়োগ করি।"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "অ্যাক্সেস"
            },
            {
              "t": "text",
              "v": " — আপনার সম্পর্কে আমাদের কাছে থাকা ব্যক্তিগত তথ্যের অনুলিপি।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "সংশোধন"
            },
            {
              "t": "text",
              "v": " — ভুল কিছু থাকলে তা সংশোধন।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "মুছে ফেলা"
            },
            {
              "t": "text",
              "v": " — আইনত সংরক্ষণ বাধ্যতামূলক রেকর্ড ছাড়া বাকি তথ্য মুছে ফেলা।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "সীমিতকরণ"
            },
            {
              "t": "text",
              "v": " — কোনো বিরোধ নিষ্পত্তি না হওয়া পর্যন্ত প্রক্রিয়াকরণ থামাতে বলা।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "পোর্টেবিলিটি"
            },
            {
              "t": "text",
              "v": " — আপনার দেওয়া তথ্যের একটি মেশিন-পাঠযোগ্য অনুলিপি।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "আপত্তি"
            },
            {
              "t": "text",
              "v": " — বৈধ স্বার্থের ভিত্তিতে করা প্রক্রিয়াকরণে আপত্তি জানানো।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "সম্মতি প্রত্যাহার"
            },
            {
              "t": "text",
              "v": " — যেখানে আমরা সম্মতির ওপর নির্ভর করেছি, যেমন যেকোনো সময় ডিভাইস সেটিংস থেকে নোটিফিকেশন বন্ধ করা।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "অভিযোগ"
            },
            {
              "t": "text",
              "v": " — [GRIEVANCE CONTACT]-এ আমাদের কাছে, অথবা আপনার স্থানীয় তথ্য সুরক্ষা কর্তৃপক্ষের কাছে।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আজ কীভাবে প্রয়োগ করবেন:"
          },
          {
            "t": "text",
            "v": " আপনার অ্যাকাউন্টের ঠিকানা থেকে [SUPPORT EMAIL]-এ ইমেইল করুন; আপনি ভাড়াটিয়া বা কর্মী হলে আপনার বাড়িওয়ালাকে বলুন (দেখুন ধারা ২)। আমরা "
          },
          {
            "t": "bold",
            "v": "[30] দিনের"
          },
          {
            "t": "text",
            "v": " মধ্যে উত্তর দেব।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "বর্তমান দুটি সীমাবদ্ধতা স্পষ্ট করে জানাচ্ছি:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": true,
        "items": [
          [
            {
              "t": "bold",
              "v": "অ্যাপের ভেতরে নিজে অ্যাকাউন্ট মুছে ফেলার ব্যবস্থা নেই।"
            },
            {
              "t": "text",
              "v": " অনুরোধ পেলে আমাদের প্রশাসকেরা তা করেন। আমরা অ্যাপের ভেতরে এই সুবিধা তৈরি করছি।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "স্বয়ংক্রিয় ডেটা এক্সপোর্ট নেই।"
            },
            {
              "t": "text",
              "v": " পোর্টেবিলিটির অনুরোধ আমরা হাতে করে পূরণ করি।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এতে আপনার অধিকার কমে না — শুধু অনুরোধটি বোতামের বদলে ইমেইলে যায়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১২. শিশু"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 18 বছরের কম বয়সীদের জন্য নয় এবং আমরা জেনেশুনে শিশুদের তথ্য সংগ্রহ করি না। "
          },
          {
            "t": "bold",
            "v": "মালিকেরা অপ্রাপ্তবয়স্কের জাতীয় পরিচয়পত্র বা ছবি প্রবেশ করাবেন না।"
          },
          {
            "t": "text",
            "v": " সেবাটিতে কোনো শিশুর তথ্য আছে বলে মনে করলে [GRIEVANCE CONTACT]-এ জানান, আমরা তা সরিয়ে দেব।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১৩. আমরা কীভাবে তথ্য সুরক্ষিত রাখি"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "ডেটাবেস সব ধরনের সরাসরি পাবলিক অ্যাক্সেস প্রত্যাখ্যান করে; প্রতিটি পঠন ও লিখন আমাদের অথেনটিকেটেড অ্যাপ্লিকেশন স্তরের মধ্য দিয়ে যায়।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ভাড়াটিয়ার NID সংরক্ষণে AES-256-GCM এনক্রিপশন থাকে (কর্মীর ব্যতিক্রমের জন্য দেখুন ধারা ৪)।"
            }
          ],
          [
            {
              "t": "text",
              "v": "পাসওয়ার্ড হ্যাশ আকারে সংরক্ষিত হয়; ভাড়াটিয়ার পাসকোড সল্টেড ও ইচ্ছাকৃতভাবে ধীরগতির হ্যাশ আকারে থাকে, পাঠযোগ্য অবস্থায় নয়।"
            }
          ],
          [
            {
              "t": "text",
              "v": "সাইন-ইন চেষ্টা, নিবন্ধন, পাসওয়ার্ড রিসেটের অনুরোধ ও সাধারণ ট্র্যাফিকে রেট লিমিট প্রয়োগ করা হয়, যাতে ব্রুট-ফোর্স ও অপব্যবহার ঠেকানো যায়।"
            }
          ],
          [
            {
              "t": "text",
              "v": "অনুরোধের আকার সীমিত, এবং ক্লায়েন্টের পাঠানো পরিচয়-হেডার বাতিল করে যাচাইকৃত টোকেন থেকে নতুন করে নির্ধারণ করা হয়, ফলে কেউ অন্যের পরিচয় দাবি করতে পারে না।"
            }
          ],
          [
            {
              "t": "text",
              "v": "পাসওয়ার্ড পরিবর্তন নিরীক্ষিত হয় এবং সবসময় অ্যাকাউন্টধারীকে ইমেইলে জানানো হয়।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "কোনো ব্যবস্থাই শতভাগ নিরাপদ নয়, এবং আমরা তেমন দাবিও করি না। ধারা ৫-এ একটি নির্দিষ্ট সীমাবদ্ধতার কথা বলা হয়েছে যা নিয়ে আমরা কাজ করছি। কোনো নিরাপত্তা ত্রুটি পেলে প্রকাশ্যে না জানিয়ে অনুগ্রহ করে [SUPPORT EMAIL]-এ জানান।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১৪. আপনার তথ্য কোথায় রাখা হয়"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমাদের হোস্টিং, ডেটাবেস ও ইমেইল সেবাদাতাদের ডেটা সেন্টার "
          },
          {
            "t": "bold",
            "v": "বাংলাদেশের বাইরে"
          },
          {
            "t": "text",
            "v": "। Bari360 ব্যবহার করার অর্থ আপনার তথ্য আন্তর্জাতিকভাবে সেই সেবাদাতাদের কাছে স্থানান্তরিত হওয়া, যাঁরা নিজেদের চুক্তি ও নিরাপত্তা প্রতিশ্রুতির অধীনে তা প্রক্রিয়া করেন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১৫. পরিবর্তন, এবং যোগাযোগ"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "পণ্যটি বদলানোর সঙ্গে সঙ্গে আমরা এই নীতি হালনাগাদ করব। কোনো পরিবর্তন আপনাকে উল্লেখযোগ্যভাবে প্রভাবিত করলে আমরা \"সর্বশেষ হালনাগাদ\" তারিখ পরিবর্তন করব এবং অ্যাপে জানাব। পরিবর্তনের পরেও Bari360 ব্যবহার চালিয়ে যাওয়ার অর্থ আপনি হালনাগাদ নীতিটি মেনে নিচ্ছেন।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "প্রশ্ন, অনুরোধ বা অভিযোগ:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "ইমেইল:"
            },
            {
              "t": "text",
              "v": " [SUPPORT EMAIL]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "গোপনীয়তা / অভিযোগ যোগাযোগ:"
            },
            {
              "t": "text",
              "v": " [GRIEVANCE CONTACT]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ফোন:"
            },
            {
              "t": "text",
              "v": " [SUPPORT PHONE]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ডাকযোগে:"
            },
            {
              "t": "text",
              "v": " [LEGAL ENTITY NAME], [REGISTERED ADDRESS]"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আরও দেখুন "
          },
          {
            "t": "link",
            "v": "শর্তাবলি",
            "href": "./TERMS_AND_CONDITIONS.bn.md"
          },
          {
            "t": "text",
            "v": ", যার "
          },
          {
            "t": "bold",
            "v": "তথ্য সংরক্ষণ নীতি"
          },
          {
            "t": "text",
            "v": " অংশে ঘর-ধরে-ঘর বলা আছে কী সংরক্ষণ করা হয়, কোথায় এবং কত দিনের জন্য।"
          }
        ]
      }
    ]
  },
  "termsEn": {
    "title": "Bari360 — Terms and Conditions",
    "blocks": [
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Effective date:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "Last updated:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "Applies to:"
          },
          {
            "t": "text",
            "v": " the Bari360 web application at "
          },
          {
            "t": "code",
            "v": "https://www.bari360.space"
          },
          {
            "t": "text",
            "v": " and the Bari360 Android application (package "
          },
          {
            "t": "code",
            "v": "com.rentmaster.app"
          },
          {
            "t": "text",
            "v": ")."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "This document is published in English and Bangla. "
          },
          {
            "t": "bold",
            "v": "The English version is authoritative."
          },
          {
            "t": "text",
            "v": " If the two versions ever conflict, the English text governs."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "These Terms incorporate the "
          },
          {
            "t": "link",
            "v": "Privacy Policy",
            "href": "./PRIVACY_POLICY.en.md"
          },
          {
            "t": "text",
            "v": ". "
          },
          {
            "t": "bold",
            "v": "Section 9 (Data Storage Policy)"
          },
          {
            "t": "text",
            "v": " sets out exactly what data we take, why, what we use it for, where it is kept and for how long."
          }
        ]
      },
      {
        "type": "hr"
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "1. Acceptance and eligibility"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "By creating an account, signing in, or using Bari360 in any way, you agree to these Terms. If you do not agree, do not use the service."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "You must be "
          },
          {
            "t": "bold",
            "v": "at least 18 years old"
          },
          {
            "t": "text",
            "v": " and legally capable of entering a contract. If you accept these Terms for a company, partnership or building association, you confirm you are authorised to bind it, and \"you\" means that organisation."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "When you create an account you are asked to tick a box confirming that you accept these Terms and the Privacy Policy. We record that acceptance — which version of these documents you agreed to, and when — so that both of us have a clear record of what was agreed."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "2. What Bari360 is — and what it is not"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 is a "
          },
          {
            "t": "bold",
            "v": "record-keeping and communication tool"
          },
          {
            "t": "text",
            "v": " for landlords and tenants. It helps you record properties and tenancies, generate rent invoices and receipts, log payments you have received, track maintenance requests, keep staff and bookkeeping records, and send notices and reminders."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Please be clear about the limits of that:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "We do not process, hold, escrow or transfer rent."
            },
            {
              "t": "text",
              "v": " Rent moves directly between tenant and landlord, entirely outside Bari360. We are not a bank, a payment gateway, a mobile financial service, or an escrow agent."
            }
          ],
          [
            {
              "t": "bold",
              "v": "A tenant marking rent as \"sent\" is an unverified claim, not proof of payment."
            },
            {
              "t": "text",
              "v": " It notifies the landlord that the tenant says they have paid. We do not check it, and it creates no obligation on us."
            }
          ],
          [
            {
              "t": "bold",
              "v": "A payment is recorded because the landlord recorded it."
            },
            {
              "t": "text",
              "v": " The accuracy of every amount, date and status in the system is the landlord's responsibility."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Receipts are documents you generate."
            },
            {
              "t": "text",
              "v": " A Bari360 receipt is your document, produced from figures you entered. It is not issued, certified or witnessed by us, and we make no representation about its sufficiency for any legal, tax or evidential purpose."
            }
          ],
          [
            {
              "t": "bold",
              "v": "We are not a party to your tenancy."
            },
            {
              "t": "text",
              "v": " Any dispute about rent, deposits, repairs, eviction or the terms of a tenancy is between landlord and tenant."
            }
          ],
          [
            {
              "t": "bold",
              "v": "We do not provide legal, tax or accounting advice."
            },
            {
              "t": "text",
              "v": " Our categories and reports are conveniences, not professional advice."
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "3. Accounts and roles"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.1 Owners"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Owners register themselves with a name, email address, password (minimum 8 characters) and optionally a phone number. You are responsible for keeping your password secret and for everything done through your account."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "*Current limitation, stated plainly: we do not yet verify email addresses at sign-up. Use an address you control — it is how you recover your account.*"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.2 Tenants"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Tenants do not register themselves."
          },
          {
            "t": "text",
            "v": " The owner creates the tenant record, and the system produces a one-time passcode which is shown to the owner "
          },
          {
            "t": "bold",
            "v": "once"
          },
          {
            "t": "text",
            "v": " to pass on to the tenant. Tenants then sign in with their phone number and that passcode."
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "The owner may reset a tenant's passcode at any time."
            }
          ],
          [
            {
              "t": "text",
              "v": "A tenant who is not currently assigned to a property is blocked from signing in by default; the owner can grant an exception."
            }
          ],
          [
            {
              "t": "text",
              "v": "A tenant's session lasts about "
            },
            {
              "t": "bold",
              "v": "7 days"
            },
            {
              "t": "text",
              "v": ", after which they sign in again."
            }
          ],
          [
            {
              "t": "text",
              "v": "Tenants can view their own rent, ledger, receipts, notices and documents, raise maintenance requests, and edit only their own name and family-member count. They cannot change their phone number, their rent, or any term of the tenancy."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Owners: "
          },
          {
            "t": "bold",
            "v": "relay passcodes privately."
          },
          {
            "t": "text",
            "v": " Anyone with a tenant's phone number and passcode can see that tenant's records."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.3 Staff"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Staff records (caretakers, guards, cleaners) are records the owner keeps. "
          },
          {
            "t": "bold",
            "v": "Staff have no login and no access to Bari360."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "3.4 Administrators"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 administrators can view accounts, manage plans, review payments, send notices and provide support. Administrative actions that affect an account — password resets, suspension, plan changes — are logged, and password changes are always emailed to the account holder."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "4. Your obligations when you enter other people's data"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "This is the most important obligation in these Terms, because most of the personal data in Bari360 is not the owner's own."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "As an owner, "
          },
          {
            "t": "bold",
            "v": "you are the data controller"
          },
          {
            "t": "text",
            "v": " for the tenant and staff data you enter (see section 2 of the Privacy Policy). You warrant that:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "You have a "
            },
            {
              "t": "bold",
              "v": "lawful basis and the person's consent"
            },
            {
              "t": "text",
              "v": " to collect, enter and store their personal data in Bari360 — "
            },
            {
              "t": "bold",
              "v": "particularly their National ID number, ID document scan and photograph."
            }
          ],
          [
            {
              "t": "text",
              "v": "You have told them that their data is held in Bari360 and made the Privacy Policy available to them."
            }
          ],
          [
            {
              "t": "text",
              "v": "The data you enter is "
            },
            {
              "t": "bold",
              "v": "accurate"
            },
            {
              "t": "text",
              "v": ", and you will correct it when you learn it is wrong."
            }
          ],
          [
            {
              "t": "text",
              "v": "You will not enter data about a "
            },
            {
              "t": "bold",
              "v": "minor"
            },
            {
              "t": "text",
              "v": ", and will not upload a minor's NID or photograph."
            }
          ],
          [
            {
              "t": "text",
              "v": "You will handle any access, correction or deletion request from your tenant or staff member promptly, and pass it to us if you need our help."
            }
          ],
          [
            {
              "t": "text",
              "v": "You will only upload documents you have the "
            },
            {
              "t": "bold",
              "v": "right"
            },
            {
              "t": "text",
              "v": " to hold and store."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "You indemnify us"
          },
          {
            "t": "text",
            "v": " for claims arising from data you entered or messages you sent — see section 13."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "5. Acceptable use"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "You must not:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "Use Bari360 for anything unlawful, or to harass, threaten, defame or intimidate anyone — including through notices, reminders or maintenance remarks."
            }
          ],
          [
            {
              "t": "text",
              "v": "Upload another person's identity documents or private records without authority."
            }
          ],
          [
            {
              "t": "text",
              "v": "Enter data you know to be false, or fabricate payment records, receipts or ledgers."
            }
          ],
          [
            {
              "t": "text",
              "v": "Share your account credentials, or use someone else's account."
            }
          ],
          [
            {
              "t": "text",
              "v": "Attempt to bypass plan limits, entitlement checks, rate limits or any access control."
            }
          ],
          [
            {
              "t": "text",
              "v": "Scrape, bulk-extract, resell or redistribute the service or the data of other users."
            }
          ],
          [
            {
              "t": "text",
              "v": "Reverse engineer, decompile or tamper with the applications, or probe our infrastructure without written permission."
            }
          ],
          [
            {
              "t": "text",
              "v": "Upload malware, or content that infringes someone else's intellectual property."
            }
          ],
          [
            {
              "t": "text",
              "v": "Use the service to send unsolicited bulk messaging unrelated to a genuine tenancy."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We may investigate suspected breaches and suspend access while we do."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "6. Your content"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "You keep ownership of everything you put into Bari360 — notices, documents, images, ledgers, templates and messages."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "You grant us a "
          },
          {
            "t": "bold",
            "v": "limited, non-exclusive, royalty-free licence"
          },
          {
            "t": "text",
            "v": " to host, store, copy, transmit and display that content "
          },
          {
            "t": "bold",
            "v": "solely to operate the service for you"
          },
          {
            "t": "text",
            "v": " — for example, storing a document so your tenant can open it, or rendering your signature onto a receipt. This licence exists only for running the service, ends when the content is deleted, and gives us no right to use your content for marketing or any other purpose."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We may remove content that is unlawful, infringing, or in breach of section 5. We do not routinely monitor content, and we are not responsible for what users write."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "7. Plans, billing and payment"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "7.1 Plans and currency"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Plans are priced in "
          },
          {
            "t": "bold",
            "v": "Bangladeshi Taka (৳ / BDT)"
          },
          {
            "t": "text",
            "v": ". Each plan defines limits — typically a maximum number of properties and tenants — and may include optional modules. Plans may be monthly, yearly, for a fixed number of days, or a custom arrangement."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "The "
          },
          {
            "t": "bold",
            "v": "Free plan never expires."
          },
          {
            "t": "text",
            "v": " If no other plan applies, its baseline limits are "
          },
          {
            "t": "bold",
            "v": "2 properties and 2 tenants"
          },
          {
            "t": "text",
            "v": "."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "The "
          },
          {
            "t": "bold",
            "v": "Whole Building"
          },
          {
            "t": "text",
            "v": " plan is a custom, contact-us arrangement: a custom build for an entire building, unlimited properties and tenants, "
          },
          {
            "t": "bold",
            "v": "one year of free maintenance included"
          },
          {
            "t": "text",
            "v": ", and a monthly or yearly contract from year two. It cannot be self-activated; you send an enquiry and we respond."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Optional paid modules"
          },
          {
            "t": "text",
            "v": " — *Staff management* and *Accounts & bookkeeping* — are enabled either by your plan or individually on your account."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "7.2 How payment actually works"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 has "
          },
          {
            "t": "bold",
            "v": "no automated payment gateway"
          },
          {
            "t": "text",
            "v": ". Paid plans work like this:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": true,
        "items": [
          [
            {
              "t": "text",
              "v": "You choose a plan and see our mobile-money wallet number, instructions and a QR code."
            }
          ],
          [
            {
              "t": "bold",
              "v": "You send the payment yourself"
            },
            {
              "t": "text",
              "v": ", outside Bari360, from your own mobile financial service account."
            }
          ],
          [
            {
              "t": "text",
              "v": "You submit the mobile number you paid from, the transaction ID, and the amount."
            }
          ],
          [
            {
              "t": "bold",
              "v": "An administrator checks it by hand against our statement."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Your plan activates only when an administrator approves it."
            },
            {
              "t": "text",
              "v": " Nothing activates automatically."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "You accept that:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "Activation is "
            },
            {
              "t": "bold",
              "v": "not instant"
            },
            {
              "t": "text",
              "v": " and depends on our review."
            }
          ],
          [
            {
              "t": "text",
              "v": "Submitting a payment is not the same as paying. If the transaction ID does not match a real transfer, it will be rejected."
            }
          ],
          [
            {
              "t": "text",
              "v": "If rejected, you will see the reason and may correct and resubmit."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Only one payment submission may be pending at a time."
            }
          ],
          [
            {
              "t": "text",
              "v": "You are responsible for entering the transaction details correctly. A wrong number sent to a wrong wallet cannot be recovered by us."
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "7.3 Expiry, grace and downgrade"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "When a paid plan reaches its end date:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": true,
        "items": [
          [
            {
              "t": "text",
              "v": "We warn you in the app and by notification when "
            },
            {
              "t": "bold",
              "v": "10 days or fewer"
            },
            {
              "t": "text",
              "v": " remain."
            }
          ],
          [
            {
              "t": "text",
              "v": "After the expiry date you enter a "
            },
            {
              "t": "bold",
              "v": "10-day grace period. You can still make changes during grace."
            }
          ],
          [
            {
              "t": "text",
              "v": "When grace ends, your account "
            },
            {
              "t": "bold",
              "v": "automatically moves to the Free plan."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "On that downgrade:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Nothing is deleted."
            },
            {
              "t": "text",
              "v": " Your data stays exactly where it is."
            }
          ],
          [
            {
              "t": "text",
              "v": "Properties and tenants above the Free limits become "
            },
            {
              "t": "bold",
              "v": "read-only"
            },
            {
              "t": "text",
              "v": " — you can view them but not edit them. The oldest records stay editable and the excess is disabled."
            }
          ],
          [
            {
              "t": "text",
              "v": "Optional paid modules switch off, and their data stays intact until you upgrade again."
            }
          ],
          [
            {
              "t": "text",
              "v": "Paying for a plan restores full access."
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "7.4 Downgrading on purpose"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "If you try to move to a smaller plan while you are using more properties or tenants than that plan allows, "
          },
          {
            "t": "bold",
            "v": "we will block the change"
          },
          {
            "t": "text",
            "v": " and tell you what to remove first. This is deliberate — it prevents you making records read-only by accident. Note the asymmetry: a downgrade you *choose* is blocked, while a downgrade caused by *expiry* proceeds and makes the excess read-only."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "7.5 One-time and trial plans"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "A plan marked as one-time or trial can be taken "
          },
          {
            "t": "bold",
            "v": "once per account, ever"
          },
          {
            "t": "text",
            "v": ". When it ends you move to the Free plan."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "7.6 Price and plan changes"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We may change prices, limits and plan structure. Changes do not affect a period you have already paid for. We will give notice in the app before a change takes effect for you."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "8. Refunds and cancellation"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Subscription fees are non-refundable except where a refund is required by applicable law."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Because payments are submitted and approved manually, genuine errors will be reviewed case by case — for example:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "a "
            },
            {
              "t": "bold",
              "v": "duplicate transfer"
            },
            {
              "t": "text",
              "v": " for the same period;"
            }
          ],
          [
            {
              "t": "text",
              "v": "a "
            },
            {
              "t": "bold",
              "v": "wrong amount"
            },
            {
              "t": "text",
              "v": " sent by mistake;"
            }
          ],
          [
            {
              "t": "text",
              "v": "a payment for a plan that was "
            },
            {
              "t": "bold",
              "v": "never activated"
            },
            {
              "t": "text",
              "v": "."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Contact [SUPPORT EMAIL] within "
          },
          {
            "t": "bold",
            "v": "[14] days"
          },
          {
            "t": "text",
            "v": " of the transaction with the transaction ID and the sender number. We will investigate and, where the error is genuine, refund or credit at our discretion. Decisions are made in good faith and are final."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Cancellation."
          },
          {
            "t": "text",
            "v": " You may stop using Bari360 at any time. Cancelling stops future renewal; it does not refund the current period, and your plan runs to its end date with the normal grace period. When it ends, your account moves to the Free plan under section 7.3 — "
          },
          {
            "t": "bold",
            "v": "your data is not deleted."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "If we terminate your account "
          },
          {
            "t": "bold",
            "v": "without cause"
          },
          {
            "t": "text",
            "v": ", we will refund the unused portion of any prepaid period. If we terminate it for a breach of these Terms, no refund is due."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "9. DATA STORAGE POLICY"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "This section sets out, specifically, "
          },
          {
            "t": "bold",
            "v": "what data we take, why we take it, what we use it for, where it is stored, and how long we keep it."
          },
          {
            "t": "text",
            "v": " It is part of these Terms and is consistent with the Privacy Policy; if you want the plain-language version with your rights attached, read the Privacy Policy."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "9.1 Where everything lives"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "All application data is stored in a "
          },
          {
            "t": "bold",
            "v": "Supabase"
          },
          {
            "t": "text",
            "v": " (PostgreSQL) database, with uploaded files in Supabase Storage. The application is hosted on "
          },
          {
            "t": "bold",
            "v": "Vercel"
          },
          {
            "t": "text",
            "v": ". Both operate data centres "
          },
          {
            "t": "bold",
            "v": "outside Bangladesh"
          },
          {
            "t": "text",
            "v": ". The database rejects all direct public access — every read and write passes through our authenticated application layer, which scopes every query to the owner who owns the record."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "9.2 The inventory"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "#"
            }
          ],
          [
            {
              "t": "text",
              "v": "What we take"
            }
          ],
          [
            {
              "t": "text",
              "v": "Why we take it"
            }
          ],
          [
            {
              "t": "text",
              "v": "What we use it for"
            }
          ],
          [
            {
              "t": "text",
              "v": "Retention"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "1"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Owner:"
              },
              {
                "t": "text",
                "v": " name, email, phone, hashed password"
              }
            ],
            [
              {
                "t": "text",
                "v": "Account creation and recovery"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sign-in, support, receipts, service email"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "2"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Owner:"
              },
              {
                "t": "text",
                "v": " signature image, WhatsApp and reminder message templates"
              }
            ],
            [
              {
                "t": "text",
                "v": "You chose to provide them"
              }
            ],
            [
              {
                "t": "text",
                "v": "Rendering receipts, pre-filling your messages"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "3"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Tenant:"
              },
              {
                "t": "text",
                "v": " name, phone, family members"
              }
            ],
            [
              {
                "t": "text",
                "v": "Identify the tenancy; phone is the tenant's login"
              }
            ],
            [
              {
                "t": "text",
                "v": "Ledgers, receipts, notices, sign-in"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the tenant record"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "4"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Tenant: National ID number"
              }
            ],
            [
              {
                "t": "text",
                "v": "Standard tenancy verification in Bangladesh"
              }
            ],
            [
              {
                "t": "text",
                "v": "Identity record, visible to the landlord only"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the tenant record — "
              },
              {
                "t": "bold",
                "v": "encrypted at rest (AES-256-GCM)"
              },
              {
                "t": "text",
                "v": ", never shown to the tenant, never shared"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "5"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Tenant:"
              },
              {
                "t": "text",
                "v": " login passcode"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sign-in without an email address"
              }
            ],
            [
              {
                "t": "text",
                "v": "Authentication only — "
              },
              {
                "t": "bold",
                "v": "stored as a salted, slow hash"
              },
              {
                "t": "text",
                "v": ", never in readable form"
              }
            ],
            [
              {
                "t": "text",
                "v": "Until reset or the record is deleted"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "6"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Tenancy terms:"
              },
              {
                "t": "text",
                "v": " monthly rent, service charge, advance, due day, start date"
              }
            ],
            [
              {
                "t": "text",
                "v": "The commercial terms being managed"
              }
            ],
            [
              {
                "t": "text",
                "v": "Invoice generation and statements"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the tenant record"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "7"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Property:"
              },
              {
                "t": "text",
                "v": " name, address, flat number, occupancy, receipt name, contact phone"
              }
            ],
            [
              {
                "t": "text",
                "v": "The asset being managed"
              }
            ],
            [
              {
                "t": "text",
                "v": "Property records, receipts"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the property record"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "8"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Service-charge breakdown:"
              },
              {
                "t": "text",
                "v": " caretaker, security, lift, water, common electricity, common gas, dust collectors"
              }
            ],
            [
              {
                "t": "text",
                "v": "Itemised billing tenants can see"
              }
            ],
            [
              {
                "t": "text",
                "v": "Invoice and receipt line items"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the property record"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "9"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Invoices:"
              },
              {
                "t": "text",
                "v": " month, rent, service charge, extra charges and remarks, discount, total, status, amount paid, paid date"
              }
            ],
            [
              {
                "t": "text",
                "v": "The core rent-tracking function"
              }
            ],
            [
              {
                "t": "text",
                "v": "Statements, dues, receipts, reports"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "10"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Payments:"
              },
              {
                "t": "text",
                "v": " amount, date, method (cash/bKash/Nagad/bank/other), note"
              }
            ],
            [
              {
                "t": "text",
                "v": "Recording part-payments and instalments"
              }
            ],
            [
              {
                "t": "text",
                "v": "Payment history and outstanding balance"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "11"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Rent revision history:"
              },
              {
                "t": "text",
                "v": " tenant name, old and new rent, who changed it, when"
              }
            ],
            [
              {
                "t": "text",
                "v": "Audit of rent changes"
              }
            ],
            [
              {
                "t": "text",
                "v": "Dispute resolution and history"
              }
            ],
            [
              {
                "t": "text",
                "v": "Kept as history — "
              },
              {
                "t": "bold",
                "v": "retains the tenant's name after the tenancy ends"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "12"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Occupancy history:"
              },
              {
                "t": "text",
                "v": " tenant name and phone, lease start and end, total rent paid"
              }
            ],
            [
              {
                "t": "text",
                "v": "Record of who occupied a property"
              }
            ],
            [
              {
                "t": "text",
                "v": "Property history"
              }
            ],
            [
              {
                "t": "text",
                "v": "Kept as history — "
              },
              {
                "t": "bold",
                "v": "retains name and phone after the tenancy ends"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "13"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Staff:"
              },
              {
                "t": "text",
                "v": " name, phone, designation, property, joining date, address, notes"
              }
            ],
            [
              {
                "t": "text",
                "v": "Managing building staff (optional module)"
              }
            ],
            [
              {
                "t": "text",
                "v": "Staff records and wage bill"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the staff record"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "14"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Staff: salary, NID number, NID document scan, photograph"
              }
            ],
            [
              {
                "t": "text",
                "v": "Employer wage and identity records"
              }
            ],
            [
              {
                "t": "text",
                "v": "Salary payments and identification"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the staff record — the "
              },
              {
                "t": "bold",
                "v": "NID number is encrypted at rest (AES-256-GCM)"
              },
              {
                "t": "text",
                "v": "; the uploaded scan and photograph are files, see section 9.4"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "15"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Staff payments:"
              },
              {
                "t": "text",
                "v": " amount, date, method, note"
              }
            ],
            [
              {
                "t": "text",
                "v": "Wage payment log"
              }
            ],
            [
              {
                "t": "text",
                "v": "Salary history and expense records"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "16"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Bookkeeping:"
              },
              {
                "t": "text",
                "v": " account names and types, opening balances, income/expense entries, transfers"
              }
            ],
            [
              {
                "t": "text",
                "v": "Optional bookkeeping module"
              }
            ],
            [
              {
                "t": "text",
                "v": "Balances and financial reports"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "17"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Documents:"
              },
              {
                "t": "text",
                "v": " tenancy deeds, agreements, ID scans (PDF or image)"
              }
            ],
            [
              {
                "t": "text",
                "v": "You attached them to a tenancy"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sharing with the relevant tenant"
              }
            ],
            [
              {
                "t": "text",
                "v": "Until deleted — "
              },
              {
                "t": "bold",
                "v": "see section 9.4"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "18"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Maintenance:"
              },
              {
                "t": "text",
                "v": " issue title and description, priority, status, remarks, photos, estimated cost"
              }
            ],
            [
              {
                "t": "text",
                "v": "Tracking repair requests"
              }
            ],
            [
              {
                "t": "text",
                "v": "Workflow between tenant and owner"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "19"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Notices, circulars and reminders:"
              },
              {
                "t": "text",
                "v": " title, content, audience, schedule, recurrence"
              }
            ],
            [
              {
                "t": "text",
                "v": "Delivering messages"
              }
            ],
            [
              {
                "t": "text",
                "v": "In-app inbox and push notifications"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "20"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Support tickets and contact enquiries:"
              },
              {
                "t": "text",
                "v": " subject, description, category, attachments, and the name/email/phone you type in"
              }
            ],
            [
              {
                "t": "text",
                "v": "So we can answer you"
              }
            ],
            [
              {
                "t": "text",
                "v": "Support and sales response"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "21"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Devices:"
              },
              {
                "t": "text",
                "v": " push token, device type (web/Android), role, and for browsers the push encryption keys"
              }
            ],
            [
              {
                "t": "text",
                "v": "Notifications cannot be delivered without a token"
              }
            ],
            [
              {
                "t": "text",
                "v": "Sending you notifications"
              }
            ],
            [
              {
                "t": "text",
                "v": "Until the device unsubscribes or the token stops working — "
              },
              {
                "t": "bold",
                "v": "then deleted automatically"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "22"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Notification preference:"
              },
              {
                "t": "text",
                "v": " sound setting"
              }
            ],
            [
              {
                "t": "text",
                "v": "Your choice"
              }
            ],
            [
              {
                "t": "text",
                "v": "Setting the notification tone"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "23"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Presence:"
              },
              {
                "t": "text",
                "v": " device identifier, role, platform, browser/device user-agent, first and last seen"
              }
            ],
            [
              {
                "t": "text",
                "v": "Showing administrators who is active; support"
              }
            ],
            [
              {
                "t": "text",
                "v": "Support and platform statistics"
              }
            ],
            [
              {
                "t": "text",
                "v": "Updated continuously while you use the app"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "24"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Error logs:"
              },
              {
                "t": "text",
                "v": " message, stack trace, route, status, your user id, role and email, "
              },
              {
                "t": "bold",
                "v": "IP address"
              },
              {
                "t": "text",
                "v": ", user-agent, reference code"
              }
            ],
            [
              {
                "t": "text",
                "v": "Diagnosing faults you report; security"
              }
            ],
            [
              {
                "t": "text",
                "v": "Support and fault diagnosis"
              }
            ],
            [
              {
                "t": "bold",
                "v": "30 days, then automatically deleted"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "25"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Password-change history:"
              },
              {
                "t": "text",
                "v": " who, method, "
              },
              {
                "t": "bold",
                "v": "IP address"
              },
              {
                "t": "text",
                "v": ", timestamp"
              }
            ],
            [
              {
                "t": "text",
                "v": "Detecting account takeover"
              }
            ],
            [
              {
                "t": "text",
                "v": "Security audit; also emailed to the account holder"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "26"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Subscription:"
              },
              {
                "t": "text",
                "v": " plan, activation, expiry, plan history"
              }
            ],
            [
              {
                "t": "text",
                "v": "Entitlements and billing"
              }
            ],
            [
              {
                "t": "text",
                "v": "Enforcing plan limits"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "27"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Payment submissions:"
              },
              {
                "t": "text",
                "v": " sender mobile number, transaction ID, amount, your email, admin decision and notes"
              }
            ],
            [
              {
                "t": "text",
                "v": "Manual reconciliation against our statement"
              }
            ],
            [
              {
                "t": "text",
                "v": "Activating your plan; financial records"
              }
            ],
            [
              {
                "t": "text",
                "v": "Life of the account — the "
              },
              {
                "t": "bold",
                "v": "sender number and transaction ID are encrypted at rest"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "28"
              }
            ],
            [
              {
                "t": "bold",
                "v": "Analytics (Google), only if enabled by an administrator"
              }
            ],
            [
              {
                "t": "text",
                "v": "Understanding usage"
              }
            ],
            [
              {
                "t": "text",
                "v": "Aggregate product analytics"
              }
            ],
            [
              {
                "t": "text",
                "v": "Governed by Google's retention — "
              },
              {
                "t": "bold",
                "v": "off by default"
              }
            ]
          ]
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "9.3 What we never store"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We never store: your bKash/Nagad PIN or account balance; your bank account or card details; GPS or precise location; your contacts, SMS, call logs or calendar; any advertising identifier. We hold no payment instrument of any kind — see section 2."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "9.4 A storage limitation we are telling you about"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Uploaded files are stored at unguessable but not access-controlled addresses."
          },
          {
            "t": "text",
            "v": " Anyone who obtains the exact link can open the file without signing in. This affects tenancy documents, ID scans, staff photographs, signatures, maintenance photos and support attachments. "
          },
          {
            "t": "bold",
            "v": "Do not forward these links."
          },
          {
            "t": "text",
            "v": " We are migrating to expiring, signed links."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Note the distinction: national ID "
          },
          {
            "t": "bold",
            "v": "numbers"
          },
          {
            "t": "text",
            "v": " are encrypted in the database (rows 4 and 14 above), but an uploaded "
          },
          {
            "t": "bold",
            "v": "image"
          },
          {
            "t": "text",
            "v": " of an ID card is a file, and this limitation applies to it."
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "9.5 Deletion"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "When an account is deleted, we purge the owner's tenants, properties, invoices, payments, staff, bookkeeping, documents, reminders, notices, support tickets, devices and account record across the database."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "That purge does not currently remove:"
          },
          {
            "t": "text",
            "v": " diagnostic logs (which expire on their own within 30 days), presence records, notification preferences, or "
          },
          {
            "t": "bold",
            "v": "files already uploaded to storage"
          },
          {
            "t": "text",
            "v": ". If you want your uploaded files removed as well, "
          },
          {
            "t": "bold",
            "v": "say so explicitly in your deletion request"
          },
          {
            "t": "text",
            "v": " and we will remove them by hand."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "How to request deletion today:"
          },
          {
            "t": "text",
            "v": " email [SUPPORT EMAIL] from the address on your account. Deletion is currently performed by an administrator; we are building a self-service route in the app. Deletion is "
          },
          {
            "t": "bold",
            "v": "permanent and irreversible"
          },
          {
            "t": "text",
            "v": " — export or print anything you need first."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "10. Availability, changes and updates"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "We do not guarantee uptime."
            },
            {
              "t": "text",
              "v": " The service is provided on an \"as available\" basis and may be interrupted by maintenance, provider outages or faults."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Maintenance mode."
            },
            {
              "t": "text",
              "v": " We may declare a maintenance window during which owners and tenants cannot use the app. We will state the window in the app where we can."
            }
          ],
          [
            {
              "t": "bold",
              "v": "The product will change."
            },
            {
              "t": "text",
              "v": " We may add, alter or withdraw features. We will not remove a significant feature you are paying for without notice and a fair remedy."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Android updates."
            },
            {
              "t": "text",
              "v": " The Android app checks for updates and can download and install a new version, which requires your permission to install applications. You may decline, but an outdated version may stop working correctly."
            }
          ],
          [
            {
              "t": "bold",
              "v": "Notifications."
            },
            {
              "t": "text",
              "v": " By enabling notifications you agree to receive service messages — rent reminders, notices from your landlord, plan and payment updates, and occasional announcements from us. You can turn notifications off in your device settings at any time. *At present the only in-app control is the notification sound; there is no per-category opt-out.*"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "11. Suspension and termination"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We may "
          },
          {
            "t": "bold",
            "v": "suspend"
          },
          {
            "t": "text",
            "v": " or "
          },
          {
            "t": "bold",
            "v": "restrict"
          },
          {
            "t": "text",
            "v": " your account if we reasonably believe you have breached these Terms, if your use threatens the security or stability of the service, if payment is fraudulent or disputed, or if we are legally required to."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "There are three distinct measures, and they are not the same thing:"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "Measure"
            }
          ],
          [
            {
              "t": "text",
              "v": "Effect"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "bold",
                "v": "Suspension"
              }
            ],
            [
              {
                "t": "text",
                "v": "You cannot sign in at all"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Permission revocation"
              }
            ],
            [
              {
                "t": "text",
                "v": "You can sign in and read your data, but cannot make changes. Applied for a breach or a serious account issue — "
              },
              {
                "t": "bold",
                "v": "it is not a billing outcome"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "Deletion"
              }
            ],
            [
              {
                "t": "text",
                "v": "Your account and data are permanently removed, subject to section 9.5"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Where circumstances allow, we will tell you why and how to put it right. You may terminate at any time under section 8."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Sections 2, 4, 6, 8, 12, 13 and 14 survive termination."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "12. Disclaimers and limitation of liability"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "The service is provided "
          },
          {
            "t": "bold",
            "v": "\"as is\" and \"as available\""
          },
          {
            "t": "text",
            "v": ", without warranties of any kind to the fullest extent the law allows. We do not warrant that it will be uninterrupted or error-free, that records will be free of inaccuracy, or that any receipt, ledger or report will be "
          },
          {
            "t": "bold",
            "v": "accepted by any court, tax authority or other body"
          },
          {
            "t": "text",
            "v": "."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "To the fullest extent permitted by law, we are "
          },
          {
            "t": "bold",
            "v": "not liable"
          },
          {
            "t": "text",
            "v": " for:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "loss of profit, revenue, rent, business, goodwill or anticipated savings;"
            }
          ],
          [
            {
              "t": "text",
              "v": "indirect or consequential loss;"
            }
          ],
          [
            {
              "t": "text",
              "v": "any dispute between a landlord and a tenant, including non-payment, deposits, repairs or eviction;"
            }
          ],
          [
            {
              "t": "text",
              "v": "inaccurate data entered by you or another user;"
            }
          ],
          [
            {
              "t": "text",
              "v": "loss or corruption of data beyond our reasonable control;"
            }
          ],
          [
            {
              "t": "bold",
              "v": "any payment made outside the service"
            },
            {
              "t": "text",
              "v": ", including rent and mobile-money transfers;"
            }
          ],
          [
            {
              "t": "text",
              "v": "interruption or failure of a third-party provider."
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Our total aggregate liability"
          },
          {
            "t": "text",
            "v": " for all claims arising out of or relating to Bari360 is limited to "
          },
          {
            "t": "bold",
            "v": "the total fees you actually paid us in the [12] months before the event giving rise to the claim"
          },
          {
            "t": "text",
            "v": ", or "
          },
          {
            "t": "bold",
            "v": "[BDT 5,000]"
          },
          {
            "t": "text",
            "v": " if you have paid us nothing."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Nothing in these Terms excludes liability that cannot lawfully be excluded, including for fraud or for death or personal injury caused by negligence."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Keep your own records."
          },
          {
            "t": "text",
            "v": " Bari360 is a convenience, not your only copy. Do not rely on it as the sole record of a legally significant matter."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "13. Indemnity"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "You will indemnify and hold harmless [LEGAL ENTITY NAME], its officers and staff against any claim, demand, loss, liability or cost (including reasonable legal fees) arising from:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "personal data you entered"
            },
            {
              "t": "text",
              "v": " about a tenant, staff member or anyone else, including any claim that you lacked consent or a lawful basis;"
            }
          ],
          [
            {
              "t": "bold",
              "v": "content you uploaded or messages you sent"
            },
            {
              "t": "text",
              "v": " through the service;"
            }
          ],
          [
            {
              "t": "text",
              "v": "your breach of these Terms or of any applicable law;"
            }
          ],
          [
            {
              "t": "text",
              "v": "a dispute between you and your tenant, landlord or staff member."
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "14. Governing law and disputes"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "These Terms are governed by the "
          },
          {
            "t": "bold",
            "v": "laws of Bangladesh"
          },
          {
            "t": "text",
            "v": ", without regard to conflict-of-law rules."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Before starting proceedings, please contact us at [SUPPORT EMAIL] — most matters are resolved quickly. If they are not, the courts of "
          },
          {
            "t": "bold",
            "v": "[CITY], Bangladesh"
          },
          {
            "t": "text",
            "v": " have exclusive jurisdiction, and you and we both submit to them."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "If a provision of these Terms is held invalid, the rest remains in force. Our failure to enforce a provision is not a waiver of it. You may not assign these Terms; we may assign them to a successor of our business."
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "These Terms and the Privacy Policy are the entire agreement between us regarding Bari360."
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "15. Changes to these Terms, and how to contact us"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "We may update these Terms as the product and the law change. We will raise the \"last updated\" date and, for material changes, tell you in the app before they take effect. Continuing to use Bari360 after that means you accept the updated Terms. If you do not accept them, stop using the service and contact us about cancelling."
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "Operator:"
            },
            {
              "t": "text",
              "v": " [LEGAL ENTITY NAME]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Registered address:"
            },
            {
              "t": "text",
              "v": " [REGISTERED ADDRESS]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Registration / trade licence:"
            },
            {
              "t": "text",
              "v": " [TRADE LICENCE / REG. NO.]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Email:"
            },
            {
              "t": "text",
              "v": " [SUPPORT EMAIL]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Phone:"
            },
            {
              "t": "text",
              "v": " [SUPPORT PHONE]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "Privacy / grievance contact:"
            },
            {
              "t": "text",
              "v": " [GRIEVANCE CONTACT]"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "See also the "
          },
          {
            "t": "link",
            "v": "Privacy Policy",
            "href": "./PRIVACY_POLICY.en.md"
          },
          {
            "t": "text",
            "v": "."
          }
        ]
      }
    ]
  },
  "termsBn": {
    "title": "বাড়ি৩৬০ — শর্তাবলি (Terms and Conditions)",
    "blocks": [
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "কার্যকর তারিখ:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "সর্বশেষ হালনাগাদ:"
          },
          {
            "t": "text",
            "v": " [EFFECTIVE DATE] "
          },
          {
            "t": "bold",
            "v": "প্রযোজ্য:"
          },
          {
            "t": "text",
            "v": " "
          },
          {
            "t": "code",
            "v": "https://www.bari360.space"
          },
          {
            "t": "text",
            "v": " ঠিকানার Bari360 ওয়েব অ্যাপ্লিকেশন এবং Bari360 অ্যান্ড্রয়েড অ্যাপ্লিকেশন (প্যাকেজ "
          },
          {
            "t": "code",
            "v": "com.rentmaster.app"
          },
          {
            "t": "text",
            "v": ")।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই দলিল ইংরেজি ও বাংলা — দুই ভাষায় প্রকাশিত। "
          },
          {
            "t": "bold",
            "v": "ইংরেজি সংস্করণটিই চূড়ান্ত ও কর্তৃত্বপূর্ণ।"
          },
          {
            "t": "text",
            "v": " দুই সংস্করণের মধ্যে কোনো অমিল দেখা দিলে ইংরেজি লেখাই প্রযোজ্য হবে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই শর্তাবলির অংশ হিসেবে "
          },
          {
            "t": "link",
            "v": "গোপনীয়তা নীতি",
            "href": "./PRIVACY_POLICY.bn.md"
          },
          {
            "t": "text",
            "v": " অন্তর্ভুক্ত। "
          },
          {
            "t": "bold",
            "v": "ধারা ৯ (তথ্য সংরক্ষণ নীতি)"
          },
          {
            "t": "text",
            "v": "-তে সুনির্দিষ্টভাবে বলা আছে আমরা কোন তথ্য নিই, কেন নিই, কী কাজে লাগাই, কোথায় রাখি এবং কত দিন রাখি।"
          }
        ]
      },
      {
        "type": "hr"
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১. গ্রহণযোগ্যতা ও যোগ্যতা"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "অ্যাকাউন্ট তৈরি করে, সাইন ইন করে, বা যেকোনোভাবে Bari360 ব্যবহার করে আপনি এই শর্তাবলিতে সম্মত হচ্ছেন। সম্মত না হলে সেবাটি ব্যবহার করবেন না।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনার বয়স "
          },
          {
            "t": "bold",
            "v": "কমপক্ষে 18 বছর"
          },
          {
            "t": "text",
            "v": " হতে হবে এবং চুক্তি করার আইনগত সক্ষমতা থাকতে হবে। কোনো কোম্পানি, অংশীদারি প্রতিষ্ঠান বা ভবন সমিতির পক্ষে সম্মতি দিলে আপনি নিশ্চিত করছেন যে আপনি তা করার জন্য অনুমোদিত, এবং \"আপনি\" বলতে সেই প্রতিষ্ঠানকে বোঝাবে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "অ্যাকাউন্ট তৈরি করার সময় আপনাকে একটি ঘরে টিক দিয়ে নিশ্চিত করতে বলা হয় যে আপনি এই শর্তাবলি ও গোপনীয়তা নীতি মেনে নিচ্ছেন। আমরা সেই সম্মতি লিপিবদ্ধ করি — আপনি এই দলিলগুলোর কোন সংস্করণে সম্মত হয়েছেন এবং কখন — যাতে কী বিষয়ে সম্মতি হয়েছিল তার স্পষ্ট রেকর্ড আমাদের দুই পক্ষের কাছেই থাকে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "২. Bari360 কী — এবং কী নয়"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 বাড়িওয়ালা ও ভাড়াটিয়াদের জন্য একটি "
          },
          {
            "t": "bold",
            "v": "রেকর্ড রাখার ও যোগাযোগের সরঞ্জাম"
          },
          {
            "t": "text",
            "v": "। এটি সম্পত্তি ও ভাড়া চুক্তি লিপিবদ্ধ করতে, ভাড়ার চালান ও রসিদ তৈরি করতে, আপনার পাওয়া টাকা লিপিবদ্ধ করতে, মেরামতের অনুরোধ অনুসরণ করতে, কর্মী ও হিসাবের রেকর্ড রাখতে এবং নোটিশ ও রিমাইন্ডার পাঠাতে সাহায্য করে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এর সীমা সম্পর্কে স্পষ্ট থাকুন:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "আমরা ভাড়ার টাকা প্রক্রিয়া, সংরক্ষণ, জিম্মায় রাখা বা স্থানান্তর করি না।"
            },
            {
              "t": "text",
              "v": " ভাড়া সরাসরি ভাড়াটিয়া ও বাড়িওয়ালার মধ্যে, সম্পূর্ণ Bari360-এর বাইরে লেনদেন হয়। আমরা ব্যাংক নই, পেমেন্ট গেটওয়ে নই, মোবাইল ফিনান্সিয়াল সার্ভিস নই, এসক্রো এজেন্টও নই।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ভাড়াটিয়ার \"পাঠানো হয়েছে\" চিহ্নিত করা একটি অযাচাইকৃত দাবি, পরিশোধের প্রমাণ নয়।"
            },
            {
              "t": "text",
              "v": " এতে বাড়িওয়ালা জানতে পারেন যে ভাড়াটিয়া পরিশোধের দাবি করছেন। আমরা তা যাচাই করি না, এবং এতে আমাদের ওপর কোনো দায় বর্তায় না।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "কোনো পেমেন্ট লিপিবদ্ধ হয় কারণ বাড়িওয়ালা তা লিপিবদ্ধ করেছেন।"
            },
            {
              "t": "text",
              "v": " ব্যবস্থায় থাকা প্রতিটি অঙ্ক, তারিখ ও অবস্থার সঠিকতার দায়িত্ব বাড়িওয়ালার।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "রসিদ আপনার তৈরি করা দলিল।"
            },
            {
              "t": "text",
              "v": " Bari360-এর রসিদ আপনার নিজের দলিল, আপনার দেওয়া হিসাব থেকে তৈরি। এটি আমাদের ইস্যু করা, প্রত্যয়িত বা সাক্ষ্যকৃত নয়, এবং কোনো আইনি, কর বা প্রমাণগত উদ্দেশ্যে এর পর্যাপ্ততা সম্পর্কে আমরা কোনো দাবি করি না।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "আমরা আপনার ভাড়া চুক্তির পক্ষ নই।"
            },
            {
              "t": "text",
              "v": " ভাড়া, জামানত, মেরামত, উচ্ছেদ বা চুক্তির শর্ত নিয়ে যেকোনো বিরোধ বাড়িওয়ালা ও ভাড়াটিয়ার মধ্যকার বিষয়।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "আমরা আইনি, কর বা হিসাবরক্ষণ বিষয়ক পরামর্শ দিই না।"
            },
            {
              "t": "text",
              "v": " আমাদের শ্রেণিবিভাগ ও প্রতিবেদন সুবিধার জন্য, পেশাদার পরামর্শ নয়।"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৩. অ্যাকাউন্ট ও ভূমিকা"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.১ মালিক"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "মালিকেরা নাম, ইমেইল, পাসওয়ার্ড (সর্বনিম্ন 8 অক্ষর) এবং ঐচ্ছিকভাবে ফোন নম্বর দিয়ে নিজেরা নিবন্ধন করেন। পাসওয়ার্ড গোপন রাখা এবং আপনার অ্যাকাউন্ট দিয়ে করা সবকিছুর দায়িত্ব আপনার।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "*বর্তমান সীমাবদ্ধতা, স্পষ্ট করে বলা: নিবন্ধনের সময় আমরা এখনো ইমেইল ঠিকানা যাচাই করি না। এমন ঠিকানা ব্যবহার করুন যা আপনার নিয়ন্ত্রণে আছে — এর মাধ্যমেই আপনি অ্যাকাউন্ট পুনরুদ্ধার করবেন।*"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.২ ভাড়াটিয়া"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "ভাড়াটিয়ারা নিজেরা নিবন্ধন করেন না।"
          },
          {
            "t": "text",
            "v": " মালিক ভাড়াটিয়ার রেকর্ড তৈরি করেন, এবং ব্যবস্থাটি একটি এককালীন পাসকোড তৈরি করে যা মালিককে "
          },
          {
            "t": "bold",
            "v": "একবারই"
          },
          {
            "t": "text",
            "v": " দেখানো হয় ভাড়াটিয়াকে পৌঁছে দেওয়ার জন্য। এরপর ভাড়াটিয়া তাঁর ফোন নম্বর ও সেই পাসকোড দিয়ে সাইন ইন করেন।"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "মালিক যেকোনো সময় ভাড়াটিয়ার পাসকোড রিসেট করতে পারেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "যে ভাড়াটিয়া বর্তমানে কোনো সম্পত্তির সঙ্গে যুক্ত নন, তিনি ডিফল্টভাবে সাইন ইন করতে পারেন না; মালিক চাইলে ছাড় দিতে পারেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ভাড়াটিয়ার সেশন প্রায় "
            },
            {
              "t": "bold",
              "v": "7 দিন"
            },
            {
              "t": "text",
              "v": " স্থায়ী হয়, এরপর আবার সাইন ইন করতে হয়।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ভাড়াটিয়ারা নিজেদের ভাড়া, খতিয়ান, রসিদ, নোটিশ ও নথি দেখতে পারেন, মেরামতের অনুরোধ করতে পারেন, এবং কেবল নিজের নাম ও পরিবারের সদস্য সংখ্যা সম্পাদনা করতে পারেন। তাঁরা নিজের ফোন নম্বর, ভাড়া বা চুক্তির কোনো শর্ত পরিবর্তন করতে পারেন না।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "মালিকদের প্রতি: "
          },
          {
            "t": "bold",
            "v": "পাসকোড ব্যক্তিগতভাবে পৌঁছে দিন।"
          },
          {
            "t": "text",
            "v": " ভাড়াটিয়ার ফোন নম্বর ও পাসকোড যাঁর কাছে থাকবে, তিনি সেই ভাড়াটিয়ার রেকর্ড দেখতে পারবেন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৩ কর্মী"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "কর্মীর রেকর্ড (কেয়ারটেকার, দারোয়ান, পরিচ্ছন্নতাকর্মী) মালিকের রাখা রেকর্ড। "
          },
          {
            "t": "bold",
            "v": "কর্মীদের কোনো লগইন নেই এবং Bari360-তে কোনো প্রবেশাধিকার নেই।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৩.৪ প্রশাসক"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360-এর প্রশাসকেরা অ্যাকাউন্ট দেখতে, প্ল্যান ব্যবস্থাপনা করতে, পেমেন্ট পর্যালোচনা করতে, নোটিশ পাঠাতে ও সহায়তা দিতে পারেন। অ্যাকাউন্টকে প্রভাবিত করে এমন প্রশাসনিক পদক্ষেপ — পাসওয়ার্ড রিসেট, স্থগিতকরণ, প্ল্যান পরিবর্তন — লিপিবদ্ধ হয়, এবং পাসওয়ার্ড পরিবর্তনের কথা সবসময় অ্যাকাউন্টধারীকে ইমেইলে জানানো হয়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৪. অন্যের তথ্য প্রবেশ করানোর সময় আপনার দায়িত্ব"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এটিই এই শর্তাবলির সবচেয়ে গুরুত্বপূর্ণ দায়িত্ব, কারণ Bari360-এর অধিকাংশ ব্যক্তিগত তথ্য মালিকের নিজের নয়।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "মালিক হিসেবে আপনি প্রবেশ করানো ভাড়াটিয়া ও কর্মীর তথ্যের "
          },
          {
            "t": "bold",
            "v": "ডেটা কন্ট্রোলার"
          },
          {
            "t": "text",
            "v": " (দেখুন গোপনীয়তা নীতির ধারা ২)। আপনি নিশ্চিত করছেন যে:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "Bari360-তে তাঁদের ব্যক্তিগত তথ্য — "
            },
            {
              "t": "bold",
              "v": "বিশেষত জাতীয় পরিচয়পত্র নম্বর, পরিচয়পত্রের স্ক্যান ও ছবি"
            },
            {
              "t": "text",
              "v": " — সংগ্রহ, প্রবেশ ও সংরক্ষণের জন্য আপনার "
            },
            {
              "t": "bold",
              "v": "আইনগত ভিত্তি ও সংশ্লিষ্ট ব্যক্তির সম্মতি"
            },
            {
              "t": "text",
              "v": " রয়েছে।"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনি তাঁদের জানিয়েছেন যে তাঁদের তথ্য Bari360-তে রাখা আছে এবং গোপনীয়তা নীতিটি তাঁদের কাছে উপলব্ধ করেছেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনার প্রবেশ করানো তথ্য "
            },
            {
              "t": "bold",
              "v": "সঠিক"
            },
            {
              "t": "text",
              "v": ", এবং ভুল জানতে পারলে আপনি তা সংশোধন করবেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনি কোনো "
            },
            {
              "t": "bold",
              "v": "অপ্রাপ্তবয়স্কের"
            },
            {
              "t": "text",
              "v": " তথ্য প্রবেশ করাবেন না, তার NID বা ছবি আপলোড করবেন না।"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনার ভাড়াটিয়া বা কর্মীর কাছ থেকে আসা অ্যাক্সেস, সংশোধন বা মুছে ফেলার অনুরোধ আপনি দ্রুত নিষ্পন্ন করবেন এবং প্রয়োজনে আমাদের কাছে পাঠাবেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনি কেবল সেসব নথিই আপলোড করবেন যা রাখার ও সংরক্ষণের "
            },
            {
              "t": "bold",
              "v": "অধিকার"
            },
            {
              "t": "text",
              "v": " আপনার আছে।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আপনি প্রবেশ করানো তথ্য বা পাঠানো বার্তা থেকে উদ্ভূত দাবির জন্য আপনি আমাদের ক্ষতিপূরণ দেবেন"
          },
          {
            "t": "text",
            "v": " — দেখুন ধারা ১৩।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৫. গ্রহণযোগ্য ব্যবহার"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনি করবেন না:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "বেআইনি কোনো কাজে Bari360 ব্যবহার, বা নোটিশ, রিমাইন্ডার ও মেরামতের মন্তব্যসহ যেকোনো মাধ্যমে কাউকে হয়রানি, হুমকি, মানহানি বা ভীতি প্রদর্শন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "অনুমতি ছাড়া অন্য কারও পরিচয়পত্র বা ব্যক্তিগত নথি আপলোড।"
            }
          ],
          [
            {
              "t": "text",
              "v": "জেনেশুনে মিথ্যা তথ্য প্রবেশ, বা বানোয়াট পেমেন্ট রেকর্ড, রসিদ বা খতিয়ান তৈরি।"
            }
          ],
          [
            {
              "t": "text",
              "v": "নিজের অ্যাকাউন্টের তথ্য শেয়ার, বা অন্যের অ্যাকাউন্ট ব্যবহার।"
            }
          ],
          [
            {
              "t": "text",
              "v": "প্ল্যানের সীমা, অধিকার যাচাই, রেট লিমিট বা কোনো প্রবেশ নিয়ন্ত্রণ এড়ানোর চেষ্টা।"
            }
          ],
          [
            {
              "t": "text",
              "v": "সেবাটি বা অন্য ব্যবহারকারীর তথ্য স্ক্র্যাপ, গণহারে আহরণ, পুনঃবিক্রয় বা পুনর্বিতরণ।"
            }
          ],
          [
            {
              "t": "text",
              "v": "অ্যাপ্লিকেশন রিভার্স ইঞ্জিনিয়ার, ডিকম্পাইল বা বিকৃত করা, অথবা লিখিত অনুমতি ছাড়া আমাদের পরিকাঠামো পরীক্ষা করা।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ম্যালওয়্যার, বা অন্যের মেধাস্বত্ব লঙ্ঘন করে এমন বিষয়বস্তু আপলোড।"
            }
          ],
          [
            {
              "t": "text",
              "v": "প্রকৃত ভাড়া চুক্তির সঙ্গে সম্পর্কহীন অযাচিত গণবার্তা পাঠাতে সেবাটি ব্যবহার।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সন্দেহভাজন লঙ্ঘন আমরা তদন্ত করতে পারি এবং তদন্তকালে প্রবেশাধিকার স্থগিত রাখতে পারি।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৬. আপনার বিষয়বস্তু"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360-তে আপনি যা রাখেন — নোটিশ, নথি, ছবি, খতিয়ান, টেমপ্লেট ও বার্তা — তার মালিকানা আপনারই থাকে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনি আমাদের একটি "
          },
          {
            "t": "bold",
            "v": "সীমিত, অ-একচেটিয়া, রয়্যালটিমুক্ত লাইসেন্স"
          },
          {
            "t": "text",
            "v": " দেন সেই বিষয়বস্তু "
          },
          {
            "t": "bold",
            "v": "কেবল আপনার জন্য সেবাটি পরিচালনার উদ্দেশ্যে"
          },
          {
            "t": "text",
            "v": " হোস্ট, সংরক্ষণ, অনুলিপি, প্রেরণ ও প্রদর্শনের — যেমন কোনো নথি সংরক্ষণ করা যাতে আপনার ভাড়াটিয়া তা খুলতে পারেন, বা রসিদে আপনার স্বাক্ষর বসানো। এই লাইসেন্স কেবল সেবা চালানোর জন্যই, বিষয়বস্তু মুছে ফেলার সঙ্গে সঙ্গে শেষ হয়ে যায়, এবং বিপণন বা অন্য কোনো উদ্দেশ্যে আপনার বিষয়বস্তু ব্যবহারের অধিকার আমাদের দেয় না।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "বেআইনি, স্বত্ব লঙ্ঘনকারী বা ধারা ৫ ভঙ্গকারী বিষয়বস্তু আমরা সরিয়ে দিতে পারি। আমরা নিয়মিতভাবে বিষয়বস্তু পর্যবেক্ষণ করি না এবং ব্যবহারকারীরা যা লেখেন তার দায় আমাদের নয়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৭. প্ল্যান, বিলিং ও পেমেন্ট"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৭.১ প্ল্যান ও মুদ্রা"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "প্ল্যানের মূল্য "
          },
          {
            "t": "bold",
            "v": "বাংলাদেশি টাকায় (৳ / BDT)"
          },
          {
            "t": "text",
            "v": " নির্ধারিত। প্রতিটি প্ল্যানে সীমা থাকে — সাধারণত সর্বোচ্চ সম্পত্তি ও ভাড়াটিয়ার সংখ্যা — এবং ঐচ্ছিক মডিউল অন্তর্ভুক্ত থাকতে পারে। প্ল্যান মাসিক, বার্ষিক, নির্দিষ্ট দিনের জন্য, বা কাস্টম ব্যবস্থা হতে পারে।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "ফ্রি প্ল্যানের মেয়াদ কখনো শেষ হয় না।"
          },
          {
            "t": "text",
            "v": " অন্য কোনো প্ল্যান প্রযোজ্য না হলে এর মূল সীমা "
          },
          {
            "t": "bold",
            "v": "2টি সম্পত্তি ও 2 জন ভাড়াটিয়া"
          },
          {
            "t": "text",
            "v": "।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "Whole Building"
          },
          {
            "t": "text",
            "v": " প্ল্যানটি একটি কাস্টম, যোগাযোগভিত্তিক ব্যবস্থা: পুরো ভবনের জন্য কাস্টম নির্মাণ, সীমাহীন সম্পত্তি ও ভাড়াটিয়া, "
          },
          {
            "t": "bold",
            "v": "এক বছরের বিনামূল্যে রক্ষণাবেক্ষণ অন্তর্ভুক্ত"
          },
          {
            "t": "text",
            "v": ", এবং দ্বিতীয় বছর থেকে মাসিক বা বার্ষিক চুক্তি। এটি নিজে চালু করা যায় না; আপনি অনুসন্ধান পাঠান, আমরা সাড়া দিই।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "ঐচ্ছিক সবেতন মডিউল"
          },
          {
            "t": "text",
            "v": " — *কর্মী ব্যবস্থাপনা* এবং *হিসাব ও বুককিপিং* — আপনার প্ল্যানের মাধ্যমে বা আপনার অ্যাকাউন্টে আলাদাভাবে চালু করা হয়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৭.২ পেমেন্ট আসলে কীভাবে কাজ করে"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360-এ "
          },
          {
            "t": "bold",
            "v": "কোনো স্বয়ংক্রিয় পেমেন্ট গেটওয়ে নেই"
          },
          {
            "t": "text",
            "v": "। সবেতন প্ল্যান এভাবে কাজ করে:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": true,
        "items": [
          [
            {
              "t": "text",
              "v": "আপনি একটি প্ল্যান বেছে নেন এবং আমাদের মোবাইল ব্যাংকিং নম্বর, নির্দেশনা ও QR কোড দেখতে পান।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "আপনি নিজে"
            },
            {
              "t": "text",
              "v": ", Bari360-এর বাইরে, নিজের মোবাইল ফিনান্সিয়াল সার্ভিস অ্যাকাউন্ট থেকে টাকা পাঠান।"
            }
          ],
          [
            {
              "t": "text",
              "v": "যে মোবাইল নম্বর থেকে পাঠিয়েছেন, লেনদেন আইডি ও পরিমাণ জমা দেন।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "একজন প্রশাসক আমাদের স্টেটমেন্টের সঙ্গে তা হাতে মিলিয়ে দেখেন।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "প্রশাসক অনুমোদন করলে তবেই আপনার প্ল্যান চালু হয়।"
            },
            {
              "t": "text",
              "v": " কিছুই স্বয়ংক্রিয়ভাবে চালু হয় না।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনি স্বীকার করছেন যে:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "প্ল্যান চালু হওয়া "
            },
            {
              "t": "bold",
              "v": "তাৎক্ষণিক নয়"
            },
            {
              "t": "text",
              "v": " এবং তা আমাদের পর্যালোচনার ওপর নির্ভর করে।"
            }
          ],
          [
            {
              "t": "text",
              "v": "পেমেন্ট জমা দেওয়া আর পেমেন্ট করা এক নয়। লেনদেন আইডি প্রকৃত কোনো লেনদেনের সঙ্গে না মিললে তা প্রত্যাখ্যাত হবে।"
            }
          ],
          [
            {
              "t": "text",
              "v": "প্রত্যাখ্যাত হলে আপনি কারণ দেখতে পাবেন এবং সংশোধন করে আবার জমা দিতে পারবেন।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "একসঙ্গে কেবল একটি পেমেন্ট জমা অপেক্ষমাণ থাকতে পারে।"
            }
          ],
          [
            {
              "t": "text",
              "v": "লেনদেনের তথ্য সঠিকভাবে লেখার দায়িত্ব আপনার। ভুল নম্বরে পাঠানো টাকা আমাদের পক্ষে ফেরত আনা সম্ভব নয়।"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৭.৩ মেয়াদ শেষ, ছাড়ের সময় ও ডাউনগ্রেড"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সবেতন প্ল্যানের মেয়াদ শেষ হলে:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": true,
        "items": [
          [
            {
              "t": "bold",
              "v": "10 দিন বা তার কম"
            },
            {
              "t": "text",
              "v": " বাকি থাকতে আমরা অ্যাপে ও নোটিফিকেশনে সতর্ক করি।"
            }
          ],
          [
            {
              "t": "text",
              "v": "মেয়াদ শেষের পর "
            },
            {
              "t": "bold",
              "v": "10 দিনের একটি ছাড়ের সময় (grace period)"
            },
            {
              "t": "text",
              "v": " শুরু হয়। "
            },
            {
              "t": "bold",
              "v": "এই সময়েও আপনি পরিবর্তন করতে পারবেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ছাড়ের সময় শেষ হলে আপনার অ্যাকাউন্ট "
            },
            {
              "t": "bold",
              "v": "স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে যায়।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সেই ডাউনগ্রেডে:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "কিছুই মুছে যায় না।"
            },
            {
              "t": "text",
              "v": " আপনার সব তথ্য যেখানে আছে সেখানেই থাকে।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ফ্রি সীমার অতিরিক্ত সম্পত্তি ও ভাড়াটিয়া "
            },
            {
              "t": "bold",
              "v": "কেবল-পঠনযোগ্য"
            },
            {
              "t": "text",
              "v": " হয়ে যায় — দেখতে পারবেন, সম্পাদনা করতে পারবেন না। পুরোনো রেকর্ডগুলো সম্পাদনাযোগ্য থাকে, অতিরিক্তগুলো নিষ্ক্রিয় হয়।"
            }
          ],
          [
            {
              "t": "text",
              "v": "ঐচ্ছিক সবেতন মডিউল বন্ধ হয়ে যায়, তবে সেগুলোর তথ্য অক্ষত থাকে; আবার আপগ্রেড করলে ফিরে পাবেন।"
            }
          ],
          [
            {
              "t": "text",
              "v": "প্ল্যানের টাকা পরিশোধ করলে পূর্ণ প্রবেশাধিকার ফিরে আসে।"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৭.৪ ইচ্ছাকৃত ডাউনগ্রেড"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "ছোট প্ল্যানে যেতে চাইলে, কিন্তু সেই প্ল্যানের সীমার চেয়ে বেশি সম্পত্তি বা ভাড়াটিয়া ব্যবহার করলে, "
          },
          {
            "t": "bold",
            "v": "আমরা পরিবর্তনটি আটকে দেব"
          },
          {
            "t": "text",
            "v": " এবং আগে কী সরাতে হবে তা জানাব। এটি ইচ্ছাকৃত — যাতে ভুল করে আপনার রেকর্ড কেবল-পঠনযোগ্য হয়ে না যায়। অসমতাটি লক্ষ্য করুন: আপনার *বেছে নেওয়া* ডাউনগ্রেড আটকে দেওয়া হয়, কিন্তু *মেয়াদ শেষে* ঘটা ডাউনগ্রেড কার্যকর হয় এবং অতিরিক্ত রেকর্ড কেবল-পঠনযোগ্য করে দেয়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৭.৫ এককালীন ও ট্রায়াল প্ল্যান"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এককালীন বা ট্রায়াল হিসেবে চিহ্নিত প্ল্যান প্রতি অ্যাকাউন্টে "
          },
          {
            "t": "bold",
            "v": "জীবনে একবারই"
          },
          {
            "t": "text",
            "v": " নেওয়া যায়। মেয়াদ শেষে আপনি ফ্রি প্ল্যানে চলে যাবেন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৭.৬ মূল্য ও প্ল্যান পরিবর্তন"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা মূল্য, সীমা ও প্ল্যানের কাঠামো পরিবর্তন করতে পারি। ইতিমধ্যে পরিশোধিত মেয়াদে এসব পরিবর্তনের প্রভাব পড়বে না। আপনার ক্ষেত্রে কার্যকর হওয়ার আগে আমরা অ্যাপে জানাব।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৮. ফেরত ও বাতিলকরণ"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "প্রযোজ্য আইনে বাধ্যতামূলক না হলে সাবস্ক্রিপশনের টাকা ফেরতযোগ্য নয়।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "যেহেতু পেমেন্ট হাতে জমা ও অনুমোদিত হয়, প্রকৃত ভুলগুলো আলাদাভাবে বিবেচনা করা হবে — যেমন:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "একই মেয়াদের জন্য "
            },
            {
              "t": "bold",
              "v": "দ্বিগুণ পাঠানো টাকা"
            },
            {
              "t": "text",
              "v": ";"
            }
          ],
          [
            {
              "t": "text",
              "v": "ভুলবশত "
            },
            {
              "t": "bold",
              "v": "ভুল অঙ্ক"
            },
            {
              "t": "text",
              "v": " পাঠানো;"
            }
          ],
          [
            {
              "t": "text",
              "v": "এমন প্ল্যানের জন্য পেমেন্ট যা "
            },
            {
              "t": "bold",
              "v": "কখনো চালুই হয়নি"
            },
            {
              "t": "text",
              "v": "।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "লেনদেনের "
          },
          {
            "t": "bold",
            "v": "[14] দিনের"
          },
          {
            "t": "text",
            "v": " মধ্যে লেনদেন আইডি ও প্রেরকের নম্বরসহ [SUPPORT EMAIL]-এ যোগাযোগ করুন। আমরা তদন্ত করব এবং ভুলটি প্রকৃত হলে নিজেদের বিবেচনায় টাকা ফেরত বা ক্রেডিট দেব। সিদ্ধান্ত সরল বিশ্বাসে নেওয়া হয় এবং তা চূড়ান্ত।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "বাতিলকরণ।"
          },
          {
            "t": "text",
            "v": " আপনি যেকোনো সময় Bari360 ব্যবহার বন্ধ করতে পারেন। বাতিল করলে ভবিষ্যতের নবায়ন বন্ধ হয়; চলতি মেয়াদের টাকা ফেরত হয় না, এবং আপনার প্ল্যান স্বাভাবিক ছাড়ের সময়সহ মেয়াদ শেষ পর্যন্ত চলে। মেয়াদ শেষে অ্যাকাউন্টটি ধারা ৭.৩ অনুযায়ী ফ্রি প্ল্যানে যায় — "
          },
          {
            "t": "bold",
            "v": "আপনার তথ্য মুছে ফেলা হয় না।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা যদি "
          },
          {
            "t": "bold",
            "v": "কোনো দোষ ছাড়াই"
          },
          {
            "t": "text",
            "v": " আপনার অ্যাকাউন্ট বন্ধ করি, তাহলে আগাম পরিশোধিত মেয়াদের অব্যবহৃত অংশ ফেরত দেব। এই শর্তাবলি ভঙ্গের কারণে বন্ধ করলে কোনো ফেরত প্রযোজ্য নয়।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "৯. তথ্য সংরক্ষণ নীতি (DATA STORAGE POLICY)"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই অংশে সুনির্দিষ্টভাবে বলা আছে "
          },
          {
            "t": "bold",
            "v": "আমরা কোন তথ্য নিই, কেন নিই, কী কাজে লাগাই, কোথায় রাখি এবং কত দিন রাখি।"
          },
          {
            "t": "text",
            "v": " এটি এই শর্তাবলির অংশ এবং গোপনীয়তা নীতির সঙ্গে সঙ্গতিপূর্ণ; আপনার অধিকারসহ সহজ ভাষার সংস্করণ চাইলে গোপনীয়তা নীতিটি পড়ুন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৯.১ সবকিছু কোথায় থাকে"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সব অ্যাপ্লিকেশন তথ্য একটি "
          },
          {
            "t": "bold",
            "v": "Supabase"
          },
          {
            "t": "text",
            "v": " (PostgreSQL) ডেটাবেসে সংরক্ষিত হয়, আর আপলোড করা ফাইল Supabase Storage-এ। অ্যাপ্লিকেশনটি "
          },
          {
            "t": "bold",
            "v": "Vercel"
          },
          {
            "t": "text",
            "v": "-এ হোস্ট করা। দুটিরই ডেটা সেন্টার "
          },
          {
            "t": "bold",
            "v": "বাংলাদেশের বাইরে"
          },
          {
            "t": "text",
            "v": "। ডেটাবেস সব ধরনের সরাসরি পাবলিক অ্যাক্সেস প্রত্যাখ্যান করে — প্রতিটি পঠন ও লিখন আমাদের অথেনটিকেটেড অ্যাপ্লিকেশন স্তরের মধ্য দিয়ে যায়, যা প্রতিটি অনুসন্ধানকে সংশ্লিষ্ট মালিকের মধ্যে সীমিত রাখে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৯.২ তালিকা"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "#"
            }
          ],
          [
            {
              "t": "text",
              "v": "কী নিই"
            }
          ],
          [
            {
              "t": "text",
              "v": "কেন নিই"
            }
          ],
          [
            {
              "t": "text",
              "v": "কী কাজে লাগে"
            }
          ],
          [
            {
              "t": "text",
              "v": "সংরক্ষণকাল"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "text",
                "v": "১"
              }
            ],
            [
              {
                "t": "bold",
                "v": "মালিক:"
              },
              {
                "t": "text",
                "v": " নাম, ইমেইল, ফোন, হ্যাশ করা পাসওয়ার্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট তৈরি ও পুনরুদ্ধার"
              }
            ],
            [
              {
                "t": "text",
                "v": "সাইন-ইন, সহায়তা, রসিদ, সেবা সংক্রান্ত ইমেইল"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২"
              }
            ],
            [
              {
                "t": "bold",
                "v": "মালিক:"
              },
              {
                "t": "text",
                "v": " স্বাক্ষরের ছবি, WhatsApp ও রিমাইন্ডার টেমপ্লেট"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনি নিজে দিয়েছেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "রসিদ তৈরি, আপনার বার্তা আগে থেকে পূরণ"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৩"
              }
            ],
            [
              {
                "t": "bold",
                "v": "ভাড়াটিয়া:"
              },
              {
                "t": "text",
                "v": " নাম, ফোন, পরিবারের সদস্য"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া চুক্তি শনাক্তকরণ; ফোনই ভাড়াটিয়ার লগইন"
              }
            ],
            [
              {
                "t": "text",
                "v": "খতিয়ান, রসিদ, নোটিশ, সাইন-ইন"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়াটিয়ার রেকর্ডের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৪"
              }
            ],
            [
              {
                "t": "bold",
                "v": "ভাড়াটিয়া: জাতীয় পরিচয়পত্র নম্বর"
              }
            ],
            [
              {
                "t": "text",
                "v": "বাংলাদেশে ভাড়া চুক্তির প্রচলিত যাচাই"
              }
            ],
            [
              {
                "t": "text",
                "v": "পরিচয় রেকর্ড, কেবল বাড়িওয়ালা দেখতে পান"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়াটিয়ার রেকর্ডের আয়ুষ্কাল — "
              },
              {
                "t": "bold",
                "v": "সংরক্ষণে এনক্রিপ্টেড (AES-256-GCM)"
              },
              {
                "t": "text",
                "v": ", ভাড়াটিয়াকে দেখানো হয় না, শেয়ার করা হয় না"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৫"
              }
            ],
            [
              {
                "t": "bold",
                "v": "ভাড়াটিয়া:"
              },
              {
                "t": "text",
                "v": " লগইন পাসকোড"
              }
            ],
            [
              {
                "t": "text",
                "v": "ইমেইল ছাড়াই সাইন-ইন"
              }
            ],
            [
              {
                "t": "text",
                "v": "কেবল অথেনটিকেশন — "
              },
              {
                "t": "bold",
                "v": "সল্টেড, ধীরগতির হ্যাশ আকারে সংরক্ষিত"
              },
              {
                "t": "text",
                "v": ", পাঠযোগ্য অবস্থায় নয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "রিসেট বা রেকর্ড মোছা পর্যন্ত"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৬"
              }
            ],
            [
              {
                "t": "bold",
                "v": "চুক্তির শর্ত:"
              },
              {
                "t": "text",
                "v": " মাসিক ভাড়া, সার্ভিস চার্জ, অগ্রিম, ভাড়ার তারিখ, শুরুর তারিখ"
              }
            ],
            [
              {
                "t": "text",
                "v": "ব্যবস্থাপনার বাণিজ্যিক শর্ত"
              }
            ],
            [
              {
                "t": "text",
                "v": "চালান ও হিসাব তৈরি"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়াটিয়ার রেকর্ডের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৭"
              }
            ],
            [
              {
                "t": "bold",
                "v": "সম্পত্তি:"
              },
              {
                "t": "text",
                "v": " নাম, ঠিকানা, ফ্ল্যাট নম্বর, অবস্থা, রসিদের নাম, যোগাযোগ ফোন"
              }
            ],
            [
              {
                "t": "text",
                "v": "ব্যবস্থাপনাধীন সম্পদ"
              }
            ],
            [
              {
                "t": "text",
                "v": "সম্পত্তির নথি, রসিদ"
              }
            ],
            [
              {
                "t": "text",
                "v": "সম্পত্তির রেকর্ডের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৮"
              }
            ],
            [
              {
                "t": "bold",
                "v": "সার্ভিস চার্জ বিভাজন:"
              },
              {
                "t": "text",
                "v": " কেয়ারটেকার, নিরাপত্তা, লিফট, পানি, সাধারণ বিদ্যুৎ ও গ্যাস, ময়লা সংগ্রহ"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়াটিয়ার দেখার মতো বিস্তারিত বিল"
              }
            ],
            [
              {
                "t": "text",
                "v": "চালান ও রসিদের খাত"
              }
            ],
            [
              {
                "t": "text",
                "v": "সম্পত্তির রেকর্ডের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "৯"
              }
            ],
            [
              {
                "t": "bold",
                "v": "চালান:"
              },
              {
                "t": "text",
                "v": " মাস, ভাড়া, সার্ভিস চার্জ, অতিরিক্ত চার্জ ও মন্তব্য, ছাড়, মোট, অবস্থা, পরিশোধিত অঙ্ক ও তারিখ"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া হিসাবের মূল কাজ"
              }
            ],
            [
              {
                "t": "text",
                "v": "হিসাব, বকেয়া, রসিদ, প্রতিবেদন"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১০"
              }
            ],
            [
              {
                "t": "bold",
                "v": "পেমেন্ট:"
              },
              {
                "t": "text",
                "v": " পরিমাণ, তারিখ, মাধ্যম (নগদ/বিকাশ/নগদ/ব্যাংক/অন্যান্য), মন্তব্য"
              }
            ],
            [
              {
                "t": "text",
                "v": "আংশিক ও কিস্তি পরিশোধ লিপিবদ্ধ করা"
              }
            ],
            [
              {
                "t": "text",
                "v": "পরিশোধের ইতিহাস ও বকেয়া"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১১"
              }
            ],
            [
              {
                "t": "bold",
                "v": "ভাড়া পরিবর্তনের ইতিহাস:"
              },
              {
                "t": "text",
                "v": " ভাড়াটিয়ার নাম, পুরোনো ও নতুন ভাড়া, কে ও কখন পরিবর্তন করেছেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়া পরিবর্তনের নিরীক্ষা"
              }
            ],
            [
              {
                "t": "text",
                "v": "বিরোধ নিষ্পত্তি ও ইতিহাস"
              }
            ],
            [
              {
                "t": "text",
                "v": "ইতিহাস হিসেবে সংরক্ষিত — "
              },
              {
                "t": "bold",
                "v": "চুক্তি শেষের পরেও ভাড়াটিয়ার নাম থাকে"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১২"
              }
            ],
            [
              {
                "t": "bold",
                "v": "বসবাসের ইতিহাস:"
              },
              {
                "t": "text",
                "v": " ভাড়াটিয়ার নাম ও ফোন, চুক্তির শুরু ও শেষ, মোট পরিশোধিত ভাড়া"
              }
            ],
            [
              {
                "t": "text",
                "v": "কোন সম্পত্তিতে কে ছিলেন তার রেকর্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "সম্পত্তির ইতিহাস"
              }
            ],
            [
              {
                "t": "text",
                "v": "ইতিহাস হিসেবে সংরক্ষিত — "
              },
              {
                "t": "bold",
                "v": "চুক্তি শেষের পরেও নাম ও ফোন থাকে"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৩"
              }
            ],
            [
              {
                "t": "bold",
                "v": "কর্মী:"
              },
              {
                "t": "text",
                "v": " নাম, ফোন, পদবি, সম্পত্তি, যোগদানের তারিখ, ঠিকানা, মন্তব্য"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভবনের কর্মী ব্যবস্থাপনা (ঐচ্ছিক মডিউল)"
              }
            ],
            [
              {
                "t": "text",
                "v": "কর্মীর রেকর্ড ও মজুরি হিসাব"
              }
            ],
            [
              {
                "t": "text",
                "v": "কর্মীর রেকর্ডের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৪"
              }
            ],
            [
              {
                "t": "bold",
                "v": "কর্মী: বেতন, NID নম্বর, NID নথির স্ক্যান, ছবি"
              }
            ],
            [
              {
                "t": "text",
                "v": "নিয়োগকর্তার মজুরি ও পরিচয় রেকর্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "বেতন পরিশোধ ও শনাক্তকরণ"
              }
            ],
            [
              {
                "t": "text",
                "v": "কর্মীর রেকর্ডের আয়ুষ্কাল — "
              },
              {
                "t": "bold",
                "v": "NID নম্বর সংরক্ষণে এনক্রিপ্টেড (AES-256-GCM)"
              },
              {
                "t": "text",
                "v": "; আপলোড করা স্ক্যান ও ছবি ফাইল, দেখুন ধারা ৯.৪"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৫"
              }
            ],
            [
              {
                "t": "bold",
                "v": "কর্মীর পেমেন্ট:"
              },
              {
                "t": "text",
                "v": " পরিমাণ, তারিখ, মাধ্যম, মন্তব্য"
              }
            ],
            [
              {
                "t": "text",
                "v": "মজুরি পরিশোধের নথি"
              }
            ],
            [
              {
                "t": "text",
                "v": "বেতনের ইতিহাস ও ব্যয় রেকর্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৬"
              }
            ],
            [
              {
                "t": "bold",
                "v": "হিসাবরক্ষণ:"
              },
              {
                "t": "text",
                "v": " হিসাবের নাম ও ধরন, প্রারম্ভিক জের, আয়/ব্যয় এন্ট্রি, স্থানান্তর"
              }
            ],
            [
              {
                "t": "text",
                "v": "ঐচ্ছিক হিসাবরক্ষণ মডিউল"
              }
            ],
            [
              {
                "t": "text",
                "v": "জের ও আর্থিক প্রতিবেদন"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৭"
              }
            ],
            [
              {
                "t": "bold",
                "v": "নথি:"
              },
              {
                "t": "text",
                "v": " ভাড়ার দলিল, চুক্তি, পরিচয়পত্রের স্ক্যান (PDF বা ছবি)"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনি ভাড়া চুক্তির সঙ্গে যুক্ত করেছেন"
              }
            ],
            [
              {
                "t": "text",
                "v": "সংশ্লিষ্ট ভাড়াটিয়ার সঙ্গে ভাগ করা"
              }
            ],
            [
              {
                "t": "text",
                "v": "মুছে ফেলা পর্যন্ত — "
              },
              {
                "t": "bold",
                "v": "দেখুন ধারা ৯.৪"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৮"
              }
            ],
            [
              {
                "t": "bold",
                "v": "মেরামত:"
              },
              {
                "t": "text",
                "v": " শিরোনাম ও বিবরণ, অগ্রাধিকার, অবস্থা, মন্তব্য, ছবি, আনুমানিক খরচ"
              }
            ],
            [
              {
                "t": "text",
                "v": "মেরামতের অনুরোধ অনুসরণ"
              }
            ],
            [
              {
                "t": "text",
                "v": "ভাড়াটিয়া ও মালিকের মধ্যে কার্যপ্রবাহ"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "১৯"
              }
            ],
            [
              {
                "t": "bold",
                "v": "নোটিশ, সার্কুলার ও রিমাইন্ডার:"
              },
              {
                "t": "text",
                "v": " শিরোনাম, বিষয়বস্তু, প্রাপক, সময়সূচি, পুনরাবৃত্তি"
              }
            ],
            [
              {
                "t": "text",
                "v": "বার্তা পৌঁছে দেওয়া"
              }
            ],
            [
              {
                "t": "text",
                "v": "ইন-অ্যাপ ইনবক্স ও পুশ নোটিফিকেশন"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২০"
              }
            ],
            [
              {
                "t": "bold",
                "v": "সাপোর্ট টিকিট ও যোগাযোগ:"
              },
              {
                "t": "text",
                "v": " বিষয়, বিবরণ, শ্রেণি, সংযুক্তি, এবং আপনার লেখা নাম/ইমেইল/ফোন"
              }
            ],
            [
              {
                "t": "text",
                "v": "যাতে আমরা উত্তর দিতে পারি"
              }
            ],
            [
              {
                "t": "text",
                "v": "সহায়তা ও বিক্রয় সাড়া"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২১"
              }
            ],
            [
              {
                "t": "bold",
                "v": "ডিভাইস:"
              },
              {
                "t": "text",
                "v": " পুশ টোকেন, ধরন (ওয়েব/অ্যান্ড্রয়েড), ভূমিকা, ব্রাউজারের ক্ষেত্রে পুশ এনক্রিপশন কী"
              }
            ],
            [
              {
                "t": "text",
                "v": "টোকেন ছাড়া নোটিফিকেশন পৌঁছানো যায় না"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনাকে নোটিফিকেশন পাঠানো"
              }
            ],
            [
              {
                "t": "text",
                "v": "আনসাবস্ক্রাইব বা টোকেন অকার্যকর হওয়া পর্যন্ত — "
              },
              {
                "t": "bold",
                "v": "এরপর স্বয়ংক্রিয়ভাবে মুছে যায়"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২২"
              }
            ],
            [
              {
                "t": "bold",
                "v": "নোটিফিকেশন পছন্দ:"
              },
              {
                "t": "text",
                "v": " সাউন্ড সেটিং"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনার পছন্দ"
              }
            ],
            [
              {
                "t": "text",
                "v": "নোটিফিকেশনের টোন নির্ধারণ"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২৩"
              }
            ],
            [
              {
                "t": "bold",
                "v": "উপস্থিতি:"
              },
              {
                "t": "text",
                "v": " ডিভাইস শনাক্তকারী, ভূমিকা, প্ল্যাটফর্ম, ব্রাউজার/ডিভাইস user-agent, প্রথম ও শেষ দেখা"
              }
            ],
            [
              {
                "t": "text",
                "v": "কে সক্রিয় তা প্রশাসককে দেখানো; সহায়তা"
              }
            ],
            [
              {
                "t": "text",
                "v": "সহায়তা ও প্ল্যাটফর্ম পরিসংখ্যান"
              }
            ],
            [
              {
                "t": "text",
                "v": "ব্যবহারের সময় ক্রমাগত হালনাগাদ হয়"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২৪"
              }
            ],
            [
              {
                "t": "bold",
                "v": "ত্রুটির লগ:"
              },
              {
                "t": "text",
                "v": " বার্তা, স্ট্যাক ট্রেস, রুট, স্ট্যাটাস, আপনার ইউজার আইডি, ভূমিকা ও ইমেইল, "
              },
              {
                "t": "bold",
                "v": "আইপি ঠিকানা"
              },
              {
                "t": "text",
                "v": ", user-agent, রেফারেন্স কোড"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনার জানানো ত্রুটি নির্ণয়; নিরাপত্তা"
              }
            ],
            [
              {
                "t": "text",
                "v": "সহায়তা ও ত্রুটি নির্ণয়"
              }
            ],
            [
              {
                "t": "bold",
                "v": "30 দিন, এরপর স্বয়ংক্রিয়ভাবে মুছে যায়"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২৫"
              }
            ],
            [
              {
                "t": "bold",
                "v": "পাসওয়ার্ড পরিবর্তনের ইতিহাস:"
              },
              {
                "t": "text",
                "v": " কে, কোন পদ্ধতিতে, "
              },
              {
                "t": "bold",
                "v": "আইপি ঠিকানা"
              },
              {
                "t": "text",
                "v": ", সময়"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্ট দখল শনাক্ত করা"
              }
            ],
            [
              {
                "t": "text",
                "v": "নিরাপত্তা নিরীক্ষা; অ্যাকাউন্টধারীকে ইমেইলও করা হয়"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২৬"
              }
            ],
            [
              {
                "t": "bold",
                "v": "সাবস্ক্রিপশন:"
              },
              {
                "t": "text",
                "v": " প্ল্যান, চালুর ও মেয়াদ শেষের তারিখ, প্ল্যানের ইতিহাস"
              }
            ],
            [
              {
                "t": "text",
                "v": "অধিকার ও বিলিং"
              }
            ],
            [
              {
                "t": "text",
                "v": "প্ল্যানের সীমা কার্যকর করা"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২৭"
              }
            ],
            [
              {
                "t": "bold",
                "v": "পেমেন্ট জমা:"
              },
              {
                "t": "text",
                "v": " প্রেরকের মোবাইল নম্বর, লেনদেন আইডি, পরিমাণ, আপনার ইমেইল, প্রশাসকের সিদ্ধান্ত ও মন্তব্য"
              }
            ],
            [
              {
                "t": "text",
                "v": "আমাদের স্টেটমেন্টের সঙ্গে হাতে মেলানো"
              }
            ],
            [
              {
                "t": "text",
                "v": "প্ল্যান চালু করা; আর্থিক রেকর্ড"
              }
            ],
            [
              {
                "t": "text",
                "v": "অ্যাকাউন্টের আয়ুষ্কাল — "
              },
              {
                "t": "bold",
                "v": "প্রেরকের নম্বর ও লেনদেন আইডি সংরক্ষণে এনক্রিপ্টেড"
              }
            ]
          ],
          [
            [
              {
                "t": "text",
                "v": "২৮"
              }
            ],
            [
              {
                "t": "bold",
                "v": "অ্যানালিটিক্স (Google), কেবল প্রশাসক চালু করলে"
              }
            ],
            [
              {
                "t": "text",
                "v": "ব্যবহার বোঝা"
              }
            ],
            [
              {
                "t": "text",
                "v": "সমষ্টিগত পণ্য বিশ্লেষণ"
              }
            ],
            [
              {
                "t": "text",
                "v": "Google-এর সংরক্ষণ নীতি অনুযায়ী — "
              },
              {
                "t": "bold",
                "v": "ডিফল্টভাবে বন্ধ"
              }
            ]
          ]
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৯.৩ আমরা যা কখনোই সংরক্ষণ করি না"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আমরা কখনোই সংরক্ষণ করি না: আপনার বিকাশ/নগদ পিন বা ব্যালান্স; আপনার ব্যাংক অ্যাকাউন্ট বা কার্ডের তথ্য; GPS বা নির্দিষ্ট অবস্থান; আপনার কন্টাক্ট, এসএমএস, কল লগ বা ক্যালেন্ডার; কোনো বিজ্ঞাপন শনাক্তকারী। আমাদের কাছে কোনো ধরনের পেমেন্ট মাধ্যম নেই — দেখুন ধারা ২।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৯.৪ একটি সীমাবদ্ধতা আমরা আপনাকে জানাচ্ছি"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আপলোড করা ফাইল অনুমান-অযোগ্য, কিন্তু প্রবেশ-নিয়ন্ত্রিত নয় এমন ঠিকানায় রাখা হয়।"
          },
          {
            "t": "text",
            "v": " যিনি সঠিক লিংকটি পেয়ে যাবেন, তিনি সাইন ইন না করেই ফাইলটি খুলতে পারবেন। এটি ভাড়ার নথি, পরিচয়পত্রের স্ক্যান, কর্মীর ছবি, স্বাক্ষর, মেরামতের ছবি ও সাপোর্ট সংযুক্তির ক্ষেত্রে প্রযোজ্য। "
          },
          {
            "t": "bold",
            "v": "এই লিংক অন্যকে পাঠাবেন না।"
          },
          {
            "t": "text",
            "v": " আমরা মেয়াদউত্তীর্ণ হওয়া, স্বাক্ষরিত লিংকে স্থানান্তর করছি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "পার্থক্যটি লক্ষ্য করুন: জাতীয় পরিচয়পত্রের "
          },
          {
            "t": "bold",
            "v": "নম্বর"
          },
          {
            "t": "text",
            "v": " ডেটাবেসে এনক্রিপ্ট করা থাকে (উপরের ৪ ও ১৪ নম্বর সারি), কিন্তু পরিচয়পত্রের আপলোড করা "
          },
          {
            "t": "bold",
            "v": "ছবি"
          },
          {
            "t": "text",
            "v": " একটি ফাইল, এবং এই সীমাবদ্ধতা তার ক্ষেত্রে প্রযোজ্য।"
          }
        ]
      },
      {
        "type": "h",
        "level": 3,
        "runs": [
          {
            "t": "text",
            "v": "৯.৫ মুছে ফেলা"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "অ্যাকাউন্ট মুছে ফেলার সময় আমরা মালিকের ভাড়াটিয়া, সম্পত্তি, চালান, পেমেন্ট, কর্মী, হিসাব, নথি, রিমাইন্ডার, নোটিশ, সাপোর্ট টিকিট, ডিভাইস ও অ্যাকাউন্টের রেকর্ড — সব ডেটাবেস জুড়ে মুছে ফেলি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "সেই মুছে ফেলা বর্তমানে সরায় না:"
          },
          {
            "t": "text",
            "v": " ডায়াগনস্টিক লগ (যা 30 দিনের মধ্যে নিজে থেকেই মুছে যায়), উপস্থিতির রেকর্ড, নোটিফিকেশন পছন্দ, এবং "
          },
          {
            "t": "bold",
            "v": "ইতিমধ্যে স্টোরেজে আপলোড করা ফাইল"
          },
          {
            "t": "text",
            "v": "। আপনার আপলোড করা ফাইলও মুছতে চাইলে "
          },
          {
            "t": "bold",
            "v": "মুছে ফেলার অনুরোধে স্পষ্টভাবে তা উল্লেখ করুন"
          },
          {
            "t": "text",
            "v": ", আমরা হাতে করে সরিয়ে দেব।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "আজ কীভাবে মুছে ফেলার অনুরোধ করবেন:"
          },
          {
            "t": "text",
            "v": " আপনার অ্যাকাউন্টের ঠিকানা থেকে [SUPPORT EMAIL]-এ ইমেইল করুন। বর্তমানে একজন প্রশাসক এটি করেন; আমরা অ্যাপের ভেতরে স্ব-সেবা ব্যবস্থা তৈরি করছি। মুছে ফেলা "
          },
          {
            "t": "bold",
            "v": "স্থায়ী ও অপরিবর্তনীয়"
          },
          {
            "t": "text",
            "v": " — প্রয়োজনীয় সবকিছু আগে রপ্তানি বা প্রিন্ট করে নিন।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১০. প্রাপ্যতা, পরিবর্তন ও আপডেট"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "আমরা নিরবচ্ছিন্ন সেবার নিশ্চয়তা দিই না।"
            },
            {
              "t": "text",
              "v": " সেবাটি \"যেমন আছে তেমন\" ভিত্তিতে দেওয়া হয় এবং রক্ষণাবেক্ষণ, সেবাদাতার বিভ্রাট বা ত্রুটির কারণে বাধাগ্রস্ত হতে পারে।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "রক্ষণাবেক্ষণ মোড।"
            },
            {
              "t": "text",
              "v": " আমরা রক্ষণাবেক্ষণের সময়সীমা ঘোষণা করতে পারি, যখন মালিক ও ভাড়াটিয়ারা অ্যাপ ব্যবহার করতে পারবেন না। সম্ভব হলে অ্যাপে সময়সীমা জানিয়ে দেব।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "পণ্যটি বদলাবে।"
            },
            {
              "t": "text",
              "v": " আমরা সুবিধা যোগ, পরিবর্তন বা প্রত্যাহার করতে পারি। আপনি টাকা দিয়ে ব্যবহার করছেন এমন গুরুত্বপূর্ণ কোনো সুবিধা আমরা আগাম নোটিশ ও ন্যায্য প্রতিকার ছাড়া সরাব না।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "অ্যান্ড্রয়েড আপডেট।"
            },
            {
              "t": "text",
              "v": " অ্যান্ড্রয়েড অ্যাপ আপডেট খোঁজে এবং নতুন সংস্করণ নামিয়ে ইনস্টল করতে পারে, যার জন্য অ্যাপ ইনস্টলের অনুমতি প্রয়োজন। আপনি প্রত্যাখ্যান করতে পারেন, তবে পুরোনো সংস্করণ ঠিকমতো কাজ না-ও করতে পারে।"
            }
          ],
          [
            {
              "t": "bold",
              "v": "নোটিফিকেশন।"
            },
            {
              "t": "text",
              "v": " নোটিফিকেশন চালু করার অর্থ আপনি সেবা সংক্রান্ত বার্তা পেতে সম্মত হচ্ছেন — ভাড়ার রিমাইন্ডার, বাড়িওয়ালার নোটিশ, প্ল্যান ও পেমেন্টের হালনাগাদ এবং আমাদের মাঝেমধ্যের ঘোষণা। আপনি যেকোনো সময় ডিভাইস সেটিংস থেকে নোটিফিকেশন বন্ধ করতে পারেন। *বর্তমানে অ্যাপের ভেতরে কেবল নোটিফিকেশন সাউন্ড নিয়ন্ত্রণ করা যায়; শ্রেণিভিত্তিক আলাদা অপ্ট-আউট নেই।*"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১১. স্থগিতকরণ ও সমাপ্তি"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আপনি এই শর্তাবলি ভঙ্গ করেছেন বলে যুক্তিসঙ্গতভাবে বিশ্বাস করলে, আপনার ব্যবহার সেবার নিরাপত্তা বা স্থিতিশীলতার জন্য হুমকি হলে, পেমেন্ট প্রতারণামূলক বা বিতর্কিত হলে, কিংবা আইনত বাধ্য হলে আমরা আপনার অ্যাকাউন্ট "
          },
          {
            "t": "bold",
            "v": "স্থগিত"
          },
          {
            "t": "text",
            "v": " বা "
          },
          {
            "t": "bold",
            "v": "সীমিত"
          },
          {
            "t": "text",
            "v": " করতে পারি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "তিনটি আলাদা ব্যবস্থা আছে, এবং সেগুলো এক নয়:"
          }
        ]
      },
      {
        "type": "table",
        "head": [
          [
            {
              "t": "text",
              "v": "ব্যবস্থা"
            }
          ],
          [
            {
              "t": "text",
              "v": "ফলাফল"
            }
          ]
        ],
        "rows": [
          [
            [
              {
                "t": "bold",
                "v": "স্থগিতকরণ"
              }
            ],
            [
              {
                "t": "text",
                "v": "আপনি একেবারেই সাইন ইন করতে পারবেন না"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "অনুমতি প্রত্যাহার"
              }
            ],
            [
              {
                "t": "text",
                "v": "সাইন ইন করে তথ্য দেখতে পারবেন, কিন্তু কোনো পরিবর্তন করতে পারবেন না। লঙ্ঘন বা গুরুতর অ্যাকাউন্ট সমস্যার জন্য প্রযোজ্য — "
              },
              {
                "t": "bold",
                "v": "এটি বিলিংয়ের ফল নয়"
              }
            ]
          ],
          [
            [
              {
                "t": "bold",
                "v": "মুছে ফেলা"
              }
            ],
            [
              {
                "t": "text",
                "v": "ধারা ৯.৫ সাপেক্ষে আপনার অ্যাকাউন্ট ও তথ্য স্থায়ীভাবে সরিয়ে ফেলা হয়"
              }
            ]
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "পরিস্থিতি অনুমতি দিলে আমরা কারণ এবং তা সংশোধনের উপায় জানাব। আপনি ধারা ৮ অনুযায়ী যেকোনো সময় সম্পর্ক শেষ করতে পারেন।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "ধারা ২, ৪, ৬, ৮, ১২, ১৩ ও ১৪ সমাপ্তির পরেও বলবৎ থাকবে।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১২. দাবি অস্বীকার ও দায়ের সীমা"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "সেবাটি আইনের সর্বোচ্চ অনুমোদিত সীমা পর্যন্ত "
          },
          {
            "t": "bold",
            "v": "\"যেমন আছে তেমন\" ও \"যতটা পাওয়া যায়\""
          },
          {
            "t": "text",
            "v": " ভিত্তিতে, কোনো ধরনের নিশ্চয়তা ছাড়াই দেওয়া হয়। আমরা নিশ্চয়তা দিই না যে সেবাটি নিরবচ্ছিন্ন বা ত্রুটিমুক্ত হবে, রেকর্ড ভুলমুক্ত থাকবে, বা কোনো রসিদ, খতিয়ান বা প্রতিবেদন "
          },
          {
            "t": "bold",
            "v": "কোনো আদালত, কর কর্তৃপক্ষ বা অন্য কোনো সংস্থা গ্রহণ করবে"
          },
          {
            "t": "text",
            "v": "।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আইনের সর্বোচ্চ অনুমোদিত সীমা পর্যন্ত আমরা "
          },
          {
            "t": "bold",
            "v": "দায়ী নই"
          },
          {
            "t": "text",
            "v": ":"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "মুনাফা, রাজস্ব, ভাড়া, ব্যবসা, সুনাম বা প্রত্যাশিত সঞ্চয়ের ক্ষতির জন্য;"
            }
          ],
          [
            {
              "t": "text",
              "v": "পরোক্ষ বা পারিণামিক ক্ষতির জন্য;"
            }
          ],
          [
            {
              "t": "text",
              "v": "বাড়িওয়ালা ও ভাড়াটিয়ার মধ্যে যেকোনো বিরোধের জন্য, যার মধ্যে ভাড়া না দেওয়া, জামানত, মেরামত বা উচ্ছেদ অন্তর্ভুক্ত;"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনার বা অন্য ব্যবহারকারীর প্রবেশ করানো ভুল তথ্যের জন্য;"
            }
          ],
          [
            {
              "t": "text",
              "v": "আমাদের যুক্তিসঙ্গত নিয়ন্ত্রণের বাইরে তথ্য হারানো বা নষ্ট হওয়ার জন্য;"
            }
          ],
          [
            {
              "t": "bold",
              "v": "সেবার বাইরে করা যেকোনো পেমেন্টের জন্য"
            },
            {
              "t": "text",
              "v": ", যার মধ্যে ভাড়া ও মোবাইল ব্যাংকিং লেনদেন অন্তর্ভুক্ত;"
            }
          ],
          [
            {
              "t": "text",
              "v": "কোনো তৃতীয় পক্ষের সেবাদাতার বিভ্রাট বা ব্যর্থতার জন্য।"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "Bari360 সংক্রান্ত সব দাবির ক্ষেত্রে "
          },
          {
            "t": "bold",
            "v": "আমাদের সর্বমোট দায়"
          },
          {
            "t": "text",
            "v": " সীমিত থাকবে "
          },
          {
            "t": "bold",
            "v": "দাবির কারণ ঘটার আগের [12] মাসে আপনি আমাদের প্রকৃতপক্ষে যত টাকা পরিশোধ করেছেন"
          },
          {
            "t": "text",
            "v": " তার মধ্যে, অথবা আপনি কিছু পরিশোধ না করে থাকলে "
          },
          {
            "t": "bold",
            "v": "[BDT 5,000]"
          },
          {
            "t": "text",
            "v": "।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আইনত বাদ দেওয়া যায় না এমন কোনো দায় — প্রতারণা, কিংবা অবহেলাজনিত মৃত্যু বা শারীরিক ক্ষতিসহ — এই শর্তাবলি দ্বারা বাদ দেওয়া হয়নি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "bold",
            "v": "নিজের রেকর্ড নিজে রাখুন।"
          },
          {
            "t": "text",
            "v": " Bari360 একটি সুবিধা, আপনার একমাত্র অনুলিপি নয়। আইনগতভাবে গুরুত্বপূর্ণ কোনো বিষয়ের একমাত্র রেকর্ড হিসেবে এর ওপর নির্ভর করবেন না।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১৩. ক্ষতিপূরণ"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "নিচের কারণে উদ্ভূত যেকোনো দাবি, ক্ষতি, দায় বা খরচ (যুক্তিসঙ্গত আইনি ফিসহ) থেকে আপনি [LEGAL ENTITY NAME], তার কর্মকর্তা ও কর্মীদের ক্ষতিপূরণ দেবেন ও নিরাপদ রাখবেন:"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "text",
              "v": "ভাড়াটিয়া, কর্মী বা অন্য কারও সম্পর্কে "
            },
            {
              "t": "bold",
              "v": "আপনার প্রবেশ করানো ব্যক্তিগত তথ্য"
            },
            {
              "t": "text",
              "v": ", যার মধ্যে সম্মতি বা আইনগত ভিত্তি না থাকার দাবি অন্তর্ভুক্ত;"
            }
          ],
          [
            {
              "t": "text",
              "v": "সেবার মাধ্যমে "
            },
            {
              "t": "bold",
              "v": "আপনার আপলোড করা বিষয়বস্তু বা পাঠানো বার্তা"
            },
            {
              "t": "text",
              "v": ";"
            }
          ],
          [
            {
              "t": "text",
              "v": "এই শর্তাবলি বা প্রযোজ্য কোনো আইন আপনার লঙ্ঘন;"
            }
          ],
          [
            {
              "t": "text",
              "v": "আপনার ও আপনার ভাড়াটিয়া, বাড়িওয়ালা বা কর্মীর মধ্যে কোনো বিরোধ।"
            }
          ]
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১৪. প্রযোজ্য আইন ও বিরোধ নিষ্পত্তি"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই শর্তাবলি "
          },
          {
            "t": "bold",
            "v": "বাংলাদেশের আইন"
          },
          {
            "t": "text",
            "v": " দ্বারা পরিচালিত হবে, আইনের সংঘাত সংক্রান্ত বিধি বিবেচনা ছাড়াই।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "মামলা শুরুর আগে অনুগ্রহ করে [SUPPORT EMAIL]-এ আমাদের সঙ্গে যোগাযোগ করুন — বেশির ভাগ বিষয় দ্রুত নিষ্পত্তি হয়। না হলে "
          },
          {
            "t": "bold",
            "v": "[CITY], বাংলাদেশ"
          },
          {
            "t": "text",
            "v": "-এর আদালতের একচ্ছত্র এখতিয়ার থাকবে, এবং আপনি ও আমরা উভয়েই তা মেনে নিচ্ছি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই শর্তাবলির কোনো ধারা অবৈধ ঘোষিত হলে বাকি অংশ বলবৎ থাকবে। কোনো ধারা প্রয়োগ না করা সেই ধারা পরিত্যাগ হিসেবে গণ্য হবে না। আপনি এই শর্তাবলি হস্তান্তর করতে পারবেন না; আমরা আমাদের ব্যবসার উত্তরাধিকারীর কাছে তা হস্তান্তর করতে পারি।"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "এই শর্তাবলি ও গোপনীয়তা নীতি মিলেই Bari360 সংক্রান্ত আমাদের মধ্যে সম্পূর্ণ চুক্তি।"
          }
        ]
      },
      {
        "type": "h",
        "level": 2,
        "runs": [
          {
            "t": "text",
            "v": "১৫. শর্তাবলির পরিবর্তন, এবং যোগাযোগ"
          }
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "পণ্য ও আইন বদলানোর সঙ্গে সঙ্গে আমরা এই শর্তাবলি হালনাগাদ করতে পারি। আমরা \"সর্বশেষ হালনাগাদ\" তারিখ পরিবর্তন করব এবং উল্লেখযোগ্য পরিবর্তনের ক্ষেত্রে কার্যকর হওয়ার আগে অ্যাপে জানাব। এরপরও Bari360 ব্যবহার চালিয়ে গেলে বোঝা যাবে আপনি হালনাগাদ শর্তাবলি মেনে নিয়েছেন। মেনে না নিলে সেবাটি ব্যবহার বন্ধ করুন এবং বাতিলকরণ নিয়ে আমাদের সঙ্গে যোগাযোগ করুন।"
          }
        ]
      },
      {
        "type": "list",
        "ordered": false,
        "items": [
          [
            {
              "t": "bold",
              "v": "পরিচালনাকারী:"
            },
            {
              "t": "text",
              "v": " [LEGAL ENTITY NAME]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "নিবন্ধিত ঠিকানা:"
            },
            {
              "t": "text",
              "v": " [REGISTERED ADDRESS]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "নিবন্ধন / ট্রেড লাইসেন্স:"
            },
            {
              "t": "text",
              "v": " [TRADE LICENCE / REG. NO.]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ইমেইল:"
            },
            {
              "t": "text",
              "v": " [SUPPORT EMAIL]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "ফোন:"
            },
            {
              "t": "text",
              "v": " [SUPPORT PHONE]"
            }
          ],
          [
            {
              "t": "bold",
              "v": "গোপনীয়তা / অভিযোগ যোগাযোগ:"
            },
            {
              "t": "text",
              "v": " [GRIEVANCE CONTACT]"
            }
          ]
        ]
      },
      {
        "type": "p",
        "runs": [
          {
            "t": "text",
            "v": "আরও দেখুন "
          },
          {
            "t": "link",
            "v": "গোপনীয়তা নীতি",
            "href": "./PRIVACY_POLICY.bn.md"
          },
          {
            "t": "text",
            "v": "।"
          }
        ]
      }
    ]
  }
} as unknown as {
  privacyEn: LegalDoc; privacyBn: LegalDoc; termsEn: LegalDoc; termsBn: LegalDoc;
};
