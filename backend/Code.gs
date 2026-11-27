function doPost(event) {
  const result = ok => ContentService.createTextOutput(JSON.stringify({ok}))
    .setMimeType(ContentService.MimeType.JSON);
  const lock = LockService.getScriptLock();
  try {
    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('INTAKE_SECRET');
    const body = JSON.parse(event.postData.contents);
    if (!secret || body.token !== secret) return result(false);
    lock.waitLock(10000);
    const book = SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID'));
    const sheet = book.getSheetByName('Briefs') || book.insertSheet('Briefs');
    if (!sheet.getLastRow()) sheet.appendRow(['Request ID','Received at','Name','Mobile','Project description','Language','Service','Email sent']);
    let row = sheet.getRange('A:A').createTextFinder(body.requestId).matchEntireCell(true).findNext()?.getRow();
    if (!row) {
      const literal = value => "'" + String(value);
      sheet.appendRow([body.requestId,new Date(),literal(body.name),literal(body.phone),literal(body.description),body.lang,body.service,'']);
      SpreadsheetApp.flush();
      row = sheet.getLastRow();
    }
    if (!sheet.getRange(row,8).getValue()) {
      MailApp.sendEmail('s65839993@gmail.com','JSweb3 收到新的项目需求',`新的项目需求已保存在 Google Drive。\n编号：${body.requestId}\n查看：${book.getUrl()}`);
      sheet.getRange(row,8).setValue(new Date());
      SpreadsheetApp.flush();
    }
    return result(true);
  } catch (error) {
    console.error('Brief storage or notification failed');
    return result(false);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
