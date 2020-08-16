'use strict'

// Description:
//   Generates help commands for Hubot.
//
// URLS:
//   /hubot/help
//
// Configuration:
//   HUBOT_HELP_REPLY_IN_PRIVATE - if set to any value, all `hubot help` replies are sent in private
//   HUBOT_HELP_DISABLE_HTTP - if set, no web entry point will be declared
//   HUBOT_HELP_HIDDEN_COMMANDS - comma-separated list of commands that will not be displayed in help
//
// Notes:
//   These commands are grabbed from comment blocks at the top of each file.

const helpContents = (name, commands) => `\
<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8">
  <title>${name} Help</title>
  <style type="text/css">
    body {
      background: #d3d6d9;
      color: #636c75;
      text-shadow: 0 1px 1px rgba(255, 255, 255, .5);
      font-family: Helvetica, Arial, sans-serif;
    }
    h1 {
      margin: 8px 0;
      padding: 0;
    }
    .commands {
      font-size: 13px;
    }
    p {
      border-bottom: 1px solid #eee;
      margin: 6px 0 0 0;
      padding-bottom: 5px;
    }
    p:last-child {
      border: 0;
    }
  </style>
  </head>
  <body>
    <h1>${name} Help</h1>
    <div class="commands">
      ${commands}
    </div>
  </body>
</html>\
`

module.exports = (robot) => {
  robot.respond(/help(?:\s+(.*))?$/i, (msg) => {
    let cmds = getHelpCommands(robot)
    const filter = msg.match[1]
    if (filter) {
      cmds = cmds.filter(cmd => cmd.match(new RegExp(`^${filter}`, 'i')))
      if (cmds.length === 0) {
        msg.send(`No available commands match ${filter}`)
        return
      }
    } else {
      cmds = cmds.filter(cmd => cmd.match(new RegExp('^hubot', 'i')))
      if (cmds.length === 0) {
        msg.send(`No available commands`)
        return
      }
    }

    const cardBody = {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: 'Bender Help'
        }
      },
      elements: []
    };
    cmds.forEach((asGroup, idx) => {
      const cmdParts = asGroup.split('-->');
      cardBody.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${cmdParts[0].trim()}**`
        },
        fields: [{
            is_short: false,
            text: {
              tag: 'plain_text',
              content: cmdParts[1].trim()
            }
          }
        ],
      });
      // if (idx != cmds.length - 1) {
      //   cardBody.elements.push({
      //     "tag": "hr"
      //   });
      // }
    });
    cardBody.elements.push({
      tag: "note",
      elements: [{
        tag: "plain_text",
        content: "help <cmd> 查看命令详情"
      }]
    });
    if (process.env.HUBOT_HELP_REPLY_IN_PRIVATE && msg.message && msg.message.user && msg.message.user.name && msg.message.user.name !== msg.message.room) {
      msg.reply('I just replied to you in private.')
      return msg.sendPrivate(cardBody)
    } else {
      return msg.send(cardBody)
    }
  })

  if (process.env.HUBOT_HELP_DISABLE_HTTP == null) {
    return robot.router.get(`/${robot.name}/help`, (req, res) => {
      let cmds = getHelpCommands(robot).map(cmd => cmd.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))

      if (req.query.q != null) {
        cmds = cmds.filter(cmd => cmd.match(new RegExp(req.query.q, 'i')))
      }

      let emit = `<p>${cmds.join('</p><p>')}</p>`

      emit = emit.replace(new RegExp(`${robot.name}`, 'ig'), `<b>${robot.name}</b>`)

      res.setHeader('content-type', 'text/html')
      res.end(helpContents(robot.name, emit))
    })
  }
}

var getHelpCommands = function getHelpCommands (robot) {
  let helpCommands = robot.helpCommands()

  if (hiddenCommandsPattern()) {
    helpCommands = helpCommands.filter(command => !hiddenCommandsPattern().test(command))
  }

  return helpCommands.sort()
}

var hiddenCommandsPattern = function hiddenCommandsPattern () {
  const hiddenCommands = process.env.HUBOT_HELP_HIDDEN_COMMANDS != null ? process.env.HUBOT_HELP_HIDDEN_COMMANDS.split(',') : undefined
  if (hiddenCommands) {
    return new RegExp(`^hubot (?:${hiddenCommands != null ? hiddenCommands.join('|') : undefined}) - `)
  }
}
