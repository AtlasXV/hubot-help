'use strict'

// Description:
//   Generates help commands for Hubot.
//
// Configuration:
//   HUBOT_HELP_REPLY_IN_PRIVATE - if set to any value, all `hubot help` replies are sent in private
//   HUBOT_HELP_DISABLE_HTTP - if set, no web entry point will be declared
//   HUBOT_HELP_HIDDEN_COMMANDS - comma-separated list of commands that will not be displayed in help
//
// Notes:
//   These commands are grabbed from comment blocks at the top of each file.

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
      cmds = cmds.filter(cmd => cmd.match(new RegExp('^hubot', 'i'))).map(cmd => cmd.replace(/^hubot\s*/i, 'Bender'))
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
    }
    cmds.forEach((asGroup, idx) => {
      const cmdParts = asGroup.split('-->')
      cardBody.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${cmdParts[0] ? cmdParts[0].trim() : 'Empty'}**`
        },
        fields: [{
          is_short: false,
          text: {
            tag: 'plain_text',
            content: cmdParts[1] ? cmdParts[1].trim() : 'Empty'
          }
        }]
      })
    })
    if(!filter){
      cardBody.elements.push({
        tag: 'note',
        elements: [{
          tag: 'plain_text',
          content: 'help <cmd> 查看命令详情'
        }]
      })
    }
    
    if (process.env.HUBOT_HELP_REPLY_IN_PRIVATE && msg.message && msg.message.user && msg.message.user.name && msg.message.user.name !== msg.message.room) {
      msg.reply('I just replied to you in private.')
      return msg.sendPrivate(cardBody)
    } else {
      return msg.send(cardBody)
    }
  })
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
