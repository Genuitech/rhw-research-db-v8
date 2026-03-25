# SOPs Extracted from: GFR- How to Index.mp4

Transcribed and extracted using Whisper + Claude



# GoFileRoom (GFR) Standard Operating Procedures

---

## SOP-001: Logging In and Navigating the GoFileRoom Interface

### Purpose
To orient users on the initial landing screen and provide foundational understanding of the GoFileRoom environment upon login.

### Step-by-Step Instructions
1. Open GoFileRoom and log in with your firm credentials.
2. Observe the landing screen — this will vary depending on how your file room has been configured by your administrator.
3. Note that the default configuration in this training starts on the **Search Document** screen.
4. Familiarize yourself with the navigation options available from the landing screen before proceeding to other tasks.

### Key Notes
- The landing page is configurable by your file room administrator and may differ between users or accounts.
- Ensure you know which screen your firm has set as the default landing page.

### Tools/Applications
- GoFileRoom (web application)

### Tags
`#gofileroom` `#navigation` `#login` `#setup`

---

## SOP-002: Understanding the GoFileRoom Filing Structure (Indexes, Drawers, and the Bucket Concept)

### Purpose
To explain the fundamental architecture of GoFileRoom so users understand how documents are stored, organized, and retrieved — replacing the traditional folder/subfolder paradigm.

### Step-by-Step Instructions
1. **Understand the "Bucket" concept:** All files in GoFileRoom are stored in one large repository (not in nested folders). There are no folders or subfolders.
2. **Understand Indexes:** Instead of navigating folder structures, GoFileRoom uses **indexes** — pieces of metadata/information about each file — to locate and retrieve documents.
   - The file room comes with default/stock indexes.
   - Indexes can be edited or renamed as needed by your administrator.
   - Indexes exist **company-wide** — the same indexes are used by every person in the firm.
3. **Understand Drawers:** GoFileRoom uses **drawers** to function like a virtual filing cabinet.
   - Multiple drawers can exist, each containing different types of information.
   - Indexes can be unique for each drawer.
   - The **Client Drawer** is the most commonly used drawer.
4. Your file room administrator sets up indexes during the initial file room configuration.

### Key Notes
- **Do not think of GoFileRoom as a folder-based system.** This is the most critical mental shift for new users.
- Indexes are the primary mechanism for finding files — accurate and consistent indexing is essential.
- Changes to indexes affect the entire firm; coordinate with your administrator before requesting changes.
- The Client Drawer will be used most frequently for standard accounting work.

### Tools/Applications
- GoFileRoom (web application)
- File Room Administrator access (for setup/configuration)

### Tags
`#gofileroom` `#indexes` `#drawers` `#document-management` `#architecture` `#filing-structure`

---

## SOP-003: Searching for Clients and Documents Using Index Fields

### Purpose
To instruct users on how to use the Client Name and Client Number search fields effectively, including lookup lists, wildcard searches, and sticky fields.

### Step-by-Step Instructions
1. Navigate to a screen with index fields (e.g., Search Document or Add Document screen).
2. **Text Box Search:**
   - Begin typing in the **Client Name** or **Client Number** field.
   - A list of items containing the text you entered will appear as you type.
3. **Lookup List Search:**
   - Click the **magnifying glass icon** next to the field to open the lookup list.
   - Note: The lookup list uses a **"starts with"** search — it only shows results that begin with the text you entered.
4. **Wildcard Search:**
   - To broaden results, add an **asterisk (\*)** to the **front** of your search text (e.g., `*Smith`).
   - This converts the search to a **"contains"** search, returning any result that contains your text anywhere in the field.
5. **Sticky Fields:**
   - Click the **checkboxes** next to the index fields you want GoFileRoom to remember.
   - Once enabled, GoFileRoom will retain and auto-populate the selected field values no matter where you navigate within the system.
   - When you return to the Add Document screen, those fields will already be populated.

### Key Notes
- The text box dropdown search and the magnifying glass lookup list produce **different results** — the text box does a "contains" search while the lookup list does a "starts with" search by default.
- Use the wildcard (asterisk) strategically to find clients when you're unsure of the exact starting characters.
- Sticky fields are extremely helpful when indexing multiple documents for the same client — they save significant time.

### Tools/Applications
- GoFileRoom (web application)

### Tags
`#gofileroom` `#search` `#indexing` `#wildcard` `#sticky-fields` `#client-lookup`

---

## SOP-004: Adding Documents via the Add Document Screen (Browser Upload)

### Purpose
To provide the standard procedure for uploading documents into GoFileRoom using the web-based Add Document screen.

### Step-by-Step Instructions
1. Navigate to the **Add Document** screen in GoFileRoom.
2. Begin entering the **index information** for the document you wish to add:
   - Client Name
   - Client Number
   - Document type/description
   - Any other required index fields
3. Once all index data is filled in, click the **Browse** button.
4. Select the file from your computer that you wish to upload.
5. Click **OK** to upload the document.
6. The document will be uploaded and the index fields will be cleared/blanked out upon successful upload.
7. **Verify the upload** (important — no success confirmation prompt is provided):
   - Navigate to the **Document Search** screen.
   - Search for the client (e.g., "Joe Smith").
   - Sort or filter by descending document date.
   - Confirm your uploaded document appears at the top of the search results.

### Key Notes
- ⚠️ **GoFileRoom does NOT provide a confirmation prompt** that your file uploaded successfully. Always verify by searching for the document afterward.
- ⚠️ **GoFileRoom will NOT prompt you to replace previously existing documents.** If you upload the same document multiple times, it will create multiple copies — just like adding files to a computer. Be careful to avoid duplicate uploads.
- Ensure all index fields are accurately completed before uploading to maintain firm-wide consistency.

### Tools/Applications
- GoFileRoom (web application)
- Web browser

### Tags
`#gofileroom` `#add-document` `#upload` `#indexing` `#browser-upload`

---

## SOP-005: Adding Documents from Adobe Acrobat (Client Add-In)

### Purpose
To provide the procedure for uploading PDF documents directly from Adobe Acrobat into GoFileRoom using the installed GoFileRoom add-in.

### Step-by-Step Instructions
1. Ensure the **GoFileRoom Client Add-in** has been installed on your computer (this is installed alongside the GoFileRoom client setup).
2. Open the PDF document in **Adobe Acrobat** (Standard or higher).
3. Use the **GoFileRoom add-in** within Adobe Acrobat to initiate the upload.
4. Complete the index information in the prompt that appears.
5. Click **Save/OK** to upload the document to GoFileRoom.

### Key Notes
- ⚠️ **The add-in ONLY works with Adobe Acrobat Standard or higher.** It will **NOT** work with Adobe Reader.
- ⚠️ **Adobe Acrobat handles saves differently than Microsoft Word/Excel.** When you use the add-in from Adobe Acrobat, it takes the file you have open and adds a **copy** of it to the file room.
- ⚠️ **If you make changes to the PDF in Adobe Acrobat and try to save, GoFileRoom will create a SEPARATE copy** of the document rather than updating the existing one.
- **To edit a PDF and save changes back to GoFileRoom:** You must **open the document FROM GoFileRoom first**, then edit it — do NOT open it from your local computer and try to save changes back.
- Contact your firm's IT expert or GoFileRoom consultant if the add-in is not installed.

### Tools/Applications
- GoFileRoom (web application)
- Adobe Acrobat (Standard or higher — **not** Adobe Reader)
- GoFileRoom Client Add-in

### Tags
`#gofileroom` `#add-document` `#adobe-acrobat` `#pdf` `#client-addin`

---

## SOP-006: Adding Documents Using Profiles (Shortcut Templates)

### Purpose
To streamline the document upload process by using pre-configured Profile templates that auto-populate index values for commonly used document types, enabling quick filing without a web browser.

### Step-by-Step Instructions

#### Setting Up a Profile
1. Create a Profile on your computer that serves as a shortcut template.
2. Configure the Profile with the index values you most frequently use (e.g., drawer, document type, tab).
3. Use the **checkboxes on the right side** of the Profile setup to pre-populate information using default values:
   - File or folder name
   - Current date
   - Modified date
   - Other available default options
4. Save the Profile — it will appear as a shortcut accessible from Windows.

#### Using a Profile — Drag and Drop Method
1. Locate the file you wish to upload on your computer.
2. **Drag and drop** the file onto the Profile shortcut.
3. The Profile window will open with index fields **pre-populated** based on the template.
4. Complete any remaining index fields (e.g., search and select the Client Name).
5. Click **OK/Save** to upload and index the document.

#### Using a Profile — Send To Method
1. Right-click the file you wish to upload.
2. Select **Send To** and choose the appropriate Profile.
3. The Profile window will open with pre-populated index fields.
4. Complete any remaining index fields.
5. Click **OK/Save** to upload.

#### Uploading Multiple Files via Profile
1. Select multiple files and drag and drop them onto a Profile shortcut.
2. Both documents will appear in the **left window** of the Profile.
3. **Important:** If the documents are different types and cannot be indexed identically:
   - Check **only one document** in the left window at a time.
   - Complete the indexing information for that specific document.
   - Click the **Index Selected Items** button.
   - Observe the status at the bottom left (e.g., "1 of 2 items indexed") — the indexed document will no longer be bolded.
4. Repeat for the remaining document(s) with their own unique indexing criteria.
5. Click **OK** when all documents are indexed.
6. You will be asked to confirm uploading all documents into the file room.
7. Each file will be uploaded with its own individual indexing criteria.

### Key Notes
- Profiles work directly from Windows — no web browser or additional application is needed.
- Profiles are excellent for repetitive filing tasks (e.g., "1040 Workpapers" Profile that auto-populates document type, drawer, and tab).
- When dragging and dropping multiple files, index them **one at a time** if they require different index values.
- The **GoFileRoom Advanced course** provides a deeper dive into Profile setup and the Control Panel.
- Two methods exist: **Drag and Drop** and **Send To** — both achieve the same result.

### Tools/Applications
- GoFileRoom Profiles (Windows desktop shortcuts)
- GoFileRoom Client Add-in / Control Panel
- Windows Explorer

### Tags
`#gofileroom` `#profiles` `#templates` `#indexing` `#drag-and-drop` `#batch-upload` `#efficiency`

---

## SOP-007: Adding Documents from Microsoft Word or Excel (Client Add-In)

### Purpose
To provide the procedure for saving documents directly into GoFileRoom from Microsoft Word or Excel using the GoFileRoom Client Add-in.

### Step-by-Step Instructions

#### Initial Upload (Adding a New Document)
1. Ensure the **GoFileRoom Client Add-in** is installed (installed during GoFileRoom client setup). If not, contact your IT department or GoFileRoom consultant.
2. Open the document in **Microsoft Word** or **Microsoft Excel**.
3. Locate the **GoFileRoom panel/ribbon** in the application.
4. Click the **Add to GoFileRoom** option.
5. Complete the index information in the prompt that appears.
6. Click **OK/Save** to upload the document.
7. Observe two changes confirming the upload:
   - The **document name** at the top of the screen will change to display all index information and indicate **"GoFileRoom Edit Mode"**.
   - The **Add to GoFileRoom** option will be **grayed out**.
   - The **Save to GoFileRoom** icon will now be **available/active**.
8. You are now editing the document **live in the GoFileRoom environment** — you are no longer editing the local file.

#### Saving Changes to an Existing GoFileRoom Document
1. Make your edits to the document while in GoFileRoom Edit Mode.
2. Click the **Save to GoFileRoom** button.
   - Note: You will **not** see the full index prompt again — instead, a simplified **Save to GoFileRoom** window appears.
3. The changes will be saved directly back to the GoFileRoom version.

#### Adding Save to GoFileRoom to Quick Access Toolbar
1. Right-click the **Save to GoFileRoom** button in the ribbon.
2. Select **Add to Quick Access Toolbar**.
3. The button will now be available in your Quick Access Toolbar for fast access.

#### Closing the Document
1. When you close Microsoft Word or Excel, you will receive a prompt asking whether to:
   - **Save your work to GoFileRoom**
   - **Save locally**
   - **Ignore/discard your changes**
2. Select the appropriate option.

### Key Notes
- The GoFileRoom Client Add-in must be installed by you or your IT department — it is not available by default.
- Once a document is in GoFileRoom Edit Mode, you are working on the **GoFileRoom copy**, not your local file.
- We **recommend adding the Save to GoFileRoom button to your Quick Access Toolbar** for efficiency.
- Pay attention to the close prompt to ensure work is saved to the correct location.

### Tools/Applications
- Microsoft Word
- Microsoft Excel
- GoFileRoom Client Add-in

### Tags
`#gofileroom` `#microsoft-word` `#microsoft-excel` `#client-addin` `#save-to-gfr` `#edit-mode`

---

## SOP-008: Adding Emails and Attachments from Microsoft Outlook (Profiles)

### Purpose
To provide the procedure for filing emails and their attachments from Microsoft Outlook into GoFileRoom using Profiles.

### Step-by-Step Instructions
1. Ensure you have **created Profiles** that are available in Microsoft Outlook (Profile creation includes an option to make them available in Outlook).
2. Locate the email you wish to file in Microsoft Outlook.
3. **Drag and drop** the email onto the appropriate **Profile shortcut** in Outlook.
4. A prompt will appear asking how to add the email:
   - **Single file:** The email and attachments will be added as one combined message file (.msg). You will need to open the message file to access any attachments.
   - **Separate files:** The email message, and each attachment (e.g., Word document, PDF) will be filed as **individual, separate items** in GoFileRoom.
5. Select your preferred option and click **OK**.
6. The **indexing Profile window** will open.
7. In the **left-hand pane**, you will see the message and each attachment listed as individual items (if you selected "separate files").
8. Index each item individually:
   - Select an item in the left pane.
   - Complete or verify the index fields.
   - Repeat for each item.
9. Click **OK/Save** to upload all items into GoFileRoom.

### Key Notes
- **Single file** option: Everything is bundled into one .msg file — useful for archival but less convenient for accessing individual attachments.
- **Separate files** option: Creates distinct entries for the email body and each attachment — recommended when attachments need to be individually searchable and accessible.
- Profiles must be set up in advance with the Outlook option enabled.
- Each item (email and attachments) can be indexed with different criteria if needed.

### Tools/Applications
- Microsoft Outlook
- GoFileRoom Profiles
- GoFileRoom Client Add-in

### Tags
`#gofileroom` `#microsoft-outlook` `#email-filing` `#profiles` `#attachments` `#indexing`

---

## SOP-009: Adding Non-Native Documents Using the Virtual Printer (Print to File Room)

### Purpose
To provide a method for filing items into GoFileRoom that do not have a native integration — such as web pages, reports from third-party tools, or any other content that can be printed.

### Step-by-Step Instructions
1. Navigate to the content you wish to file (e.g., an IRS web page,