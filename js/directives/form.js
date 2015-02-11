'use strict';

formsAngular
  .directive('formInput', ['$compile', '$rootScope', '$filter', '$data',
        'routingService', 'cssFrameworkService', 'formGenerator', 'formMarkupHelper',
        function ($compile, $rootScope, $filter, $data, routingService, cssFrameworkService, formGenerator, formMarkupHelper) {
    return {
      restrict: 'EA',
      link: function (scope, element, attrs) {
//                generate markup for bootstrap forms
//
//                Bootstrap 3
//                Horizontal (default)
//                <div class="form-group">
//                    <label for="inputEmail3" class="col-sm-2 control-label">Email</label>
//                    <div class="col-sm-10">
//                        <input type="email" class="form-control" id="inputEmail3" placeholder="Email">
//                    </div>
//                 </div>
//
//                Vertical
//                <div class="form-group">
//                    <label for="exampleInputEmail1">Email address</label>
//                    <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Enter email">
//                </div>
//
//                Inline
//                <div class="form-group">
//                    <label class="sr-only" for="exampleInputEmail2">Email address</label>
//                    <input type="email" class="form-control" id="exampleInputEmail2" placeholder="Enter email">
//                </div>

//                Bootstrap 2
//                Horizontal (default)
//                <div class="control-group">
//                    <label class="control-label" for="inputEmail">Email</label>
//                    <div class="controls">
//                        <input type="text" id="inputEmail" placeholder="Email">
//                    </div>
//                </div>
//
//                Vertical
//                <label>Label name</label>
//                <input type="text" placeholder="Type something…">
//                <span class="help-block">Example block-level help text here.</span>
//
//                Inline
//                <input type="text" class="input-small" placeholder="Email">

        var subkeys = [];
        var tabsSetup = false;

        var generateInput = function (fieldInfo, modelString, isRequired, idString, options) {
          var nameString;
          if (!modelString) {
            var modelBase = (options.model || 'record') + '.';
            modelString = modelBase;
            if (options.subschema && fieldInfo.name.indexOf('.') !== -1) {
              // Schema handling - need to massage the ngModel and the id
              var compoundName = fieldInfo.name;
              var root = options.subschemaRoot;
              var lastPart = compoundName.slice(root.length+1);
              if (options.index) {
                modelString += root + '[' + options.index + '].' + lastPart;
                idString = 'f_' + modelString.slice(modelBase.length).replace(/(\.|\[|\]\.)/g, '-');
              } else {
                modelString += root;
                if (options.subkey) {
                  idString = modelString.slice(modelBase.length).replace(/\./g, '-')+'-subkey'+options.subkeyno + '-' + lastPart;
                  modelString += '[' + '$_arrayOffset_' + root.replace(/\./g, '_') + '_' + options.subkeyno + '].' + lastPart;
                } else {
                  modelString += '[$index].' + lastPart;
                  idString = null;
                  nameString = compoundName.replace(/\./g, '-');
                }
              }
            } else {
              modelString += fieldInfo.name;
            }
          }

          var allInputsVars = formMarkupHelper.allInputsVars(scope, fieldInfo, options, modelString, idString, nameString);
          var common = allInputsVars.common;
          var value;
          var requiredStr = (isRequired || fieldInfo.required) ? ' required' : '';

          switch (fieldInfo.type) {
            case 'select' :
              if (fieldInfo.select2) {
                common += 'class="fng-select2' + allInputsVars.formControl + allInputsVars.compactClass + allInputsVars.sizeClassBS2 + '"';
                common += (fieldInfo.readonly ? ' readonly' : '');
                common += (fieldInfo.required ? ' ng-required="true"' : '');
                if (fieldInfo.select2.fngAjax) {
                  if (cssFrameworkService.framework() === 'bs2') {
                    value = '<div class="input-append">';
                    value += '<input ui-select2="' + fieldInfo.select2.fngAjax + '" ' + common + '>';
                    value += '<button class="btn" type="button" data-select2-open="' + idString + '" ng-click="openSelect2($event)"><i class="icon-search"></i></button>';
                    value += '</div>';
                  } else {
                    value = '<div class="input-group">';
                    value += '<input ui-select2="' + fieldInfo.select2.fngAjax + '" ' + common + '>';
                    value += '<span class="input-group-addon' + allInputsVars.compactClass + '" data-select2-open="' + idString + '" ';
                    value += '    ng-click="openSelect2($event)"><i class="glyphicon glyphicon-search"></i></span>';
                    value += '</div>';
                  }
                } else if (fieldInfo.select2) {
                  value = '<input ui-select2="' + fieldInfo.select2.s2query + '" ' + common + '>';
                }
              } else {
                common += (fieldInfo.readonly ? 'disabled ' : '');
                value = '<select ' + common + 'class="' + allInputsVars.formControl.trim() + allInputsVars.compactClass + allInputsVars.sizeClassBS2 + '" ' + requiredStr +'>';
                if (!isRequired) {
                  value += '<option></option>';
                }
                if (angular.isArray(fieldInfo.options)) {
                  angular.forEach(fieldInfo.options, function (optValue) {
                    if (_.isObject(optValue)) {
                      value += '<option value="' + (optValue.val || optValue.id) + '">' + (optValue.label || optValue.text) + '</option>';
                    } else {
                      value += '<option>' + optValue + '</option>';
                    }
                  });
                } else {
                  value += '<option ng-repeat="option in ' + fieldInfo.options + '">{{option}}</option>';
                }
                value += '</select>';
              }
              break;
            case 'link' :
              value = '<a ng-href="/' + routingService.buildUrl('') + fieldInfo.ref + (fieldInfo.form ? '/' + fieldInfo.form : '') + '/{{ ' + modelString + '}}/edit">' + fieldInfo.linkText + '</a>';
              break;
            case 'radio' :
              value = '';
              common += requiredStr + (fieldInfo.readonly ? ' disabled ' : ' ');
              var separateLines = (options.formstyle !== 'inline' && !fieldInfo.inlineRadio);

              if (angular.isArray(fieldInfo.options)) {
                if (options.subschema) { common = common.replace('name="', 'name="{{$index}}-'); }
                angular.forEach(fieldInfo.options, function (optValue) {
                  value += '<input ' + common + 'type="radio"';
                  value += ' value="' + optValue + '">' + optValue;
                  if (separateLines) { value += '<br />'; }
                });
              } else {
                var tagType = separateLines ? 'div' : 'span';
                if (options.subschema) { common = common.replace('$index', '$parent.$index').replace('name="', 'name="{{$parent.$index}}-'); }
                value += '<' + tagType + ' ng-repeat="option in ' + fieldInfo.options + '"><input ' + common + ' type="radio" value="{{option}}"> {{option}} </' + tagType + '> ';
              }
              break;
            case 'checkbox' :
              common += requiredStr + (fieldInfo.readonly ? ' disabled ' : ' ');
              if (cssFrameworkService.framework() === 'bs3') {
                value = '<div class="checkbox"><input ' + common + 'type="checkbox"></div>';
              } else {
                value = formMarkupHelper.generateSimpleInput(common, fieldInfo, options);
              }
              break;
            default:
              common += formMarkupHelper.addTextInputMarkup(allInputsVars, fieldInfo, requiredStr);
              if (fieldInfo.type === 'textarea') {
                if (fieldInfo.rows) {
                  if (fieldInfo.rows === 'auto') {
                    common += 'msd-elastic="\n" class="ng-animate" ';
                  } else {
                    common += 'rows = "' + fieldInfo.rows + '" ';
                  }
                }
                if (fieldInfo.editor === 'ckEditor') {
                  common += 'ckeditor = "" ';
                  if (cssFrameworkService.framework() === 'bs3') { allInputsVars.sizeClassBS3 = 'col-xs-12'; }
                }
                value = '<textarea ' + common + ' />';
              } else {
                value = formMarkupHelper.generateSimpleInput(common, fieldInfo, options);
              }
          }
          return formMarkupHelper.inputChrome(value, fieldInfo, options, allInputsVars);
        };

        var convertFormStyleToClass = function (aFormStyle) {
          var result;
          switch (aFormStyle) {
            case 'horizontal' :
              result = 'form-horizontal';
              break;
            case 'vertical' :
              result = '';
              break;
            case 'inline' :
              result = 'form-inline';
              break;
            case 'horizontalCompact' :
              result = 'form-horizontal compact';
              break;
            default:
              result = 'form-horizontal compact';
              break;
          }
          return result;
        };

        var containerInstructions = function (info) {
          var result = {before: '', after: ''};
          if (typeof info.containerType === 'function') {
            result = info.containerType(info);
          } else {
            switch (info.containerType) {
              case 'tab' :
                var tabNo=-1;
                for (var i=0 ; i < scope.tabs.length; i++) {
                  if (scope.tabs[i].title === info.title) {
                    tabNo = i;
                    break;
                  }
                }
                if (tabNo >= 0) {
                  result.before = '<tab select="updateQueryForTab(\'' + info.title + '\')" heading="' + info.title + '" active="tabs[' + tabNo + '].active">';
                  result.after = '</tab>';
                } else {
                  result.before = '<p>Error!  Tab ' + info.title + ' not found in tab list</p>';
                  result.after = '';
                }
                break;
              case 'tabset' :
                result.before = '<tabset>';
                result.after = '</tabset>';
                break;
              case 'well' :
                result.before = '<div class="well">';
                if (info.title) {
                  result.before += '<h4>' + info.title + '</h4>';
                }
                result.after = '</div>';
                break;
              case 'well-large' :
                result.before = '<div class="well well-lg well-large">';
                result.after = '</div>';
                break;
              case 'well-small' :
                result.before = '<div class="well well-sm well-small">';
                result.after = '</div>';
                break;
              case 'fieldset' :
                result.before = '<fieldset>';
                if (info.title) {
                  result.before += '<legend>' + info.title + '</legend>';
                }
                result.after = '</fieldset>';
                break;
              case undefined:
                break;
              case null:
                break;
              case '':
                break;
              default:
                result.before = '<div class="' + info.containerType + '">';
                if (info.title) {
                  var titleLook = info.titleTagOrClass || 'h4';
                  if (titleLook.match(/h[1-6]/)) {
                    result.before += '<' + titleLook + '>' + info.title + '</' + titleLook + '>';
                  } else {
                    result.before += '<p class="' + titleLook + '">' + info.title + '</p>';
                  }
                }
                result.after = '</div>';
                break;
            }
          }
          return result;
        };

        var handleField = function (info, options) {
          var fieldChrome = formMarkupHelper.fieldChrome(scope, info, options);
          var template = fieldChrome.template;

          if (info.schema) {
            var niceName = info.name.replace(/\./g, '_');
            var schemaDefName = '$_schema_' + niceName;
            scope[schemaDefName] = info.schema;
            if (info.schema) { // display as a control group
              //schemas (which means they are arrays in Mongoose)
              // Check for subkey - selecting out one or more of the array
              if (info.subkey) {
                info.subkey.path = info.name;
                scope[schemaDefName + '_subkey'] = info.subkey;

                var subKeyArray = angular.isArray(info.subkey) ? info.subkey : [info.subkey];
                for (var arraySel = 0; arraySel < subKeyArray.length; arraySel++) {
                  var topAndTail = containerInstructions(subKeyArray[arraySel]);
                  template += topAndTail.before;
                  template += processInstructions(info.schema, null, {subschema: true, formStyle: options.formstyle, subkey: schemaDefName + '_subkey', subkeyno: arraySel, subschemaRoot: info.name});
                  template += topAndTail.after;
                }
                subkeys.push(info);
              } else {
                template += '<div class="schema-head">' + info.label;
                if (info.unshift) {
                  if (cssFrameworkService.framework() === 'bs2') {
                    template += '    <button id="unshift_' + info.id + '_btn" class="add-btn btn btn-mini form-btn" ng-click="unshift(\'' + info.name + '\',$event)">' +
                    '        <i class="icon-plus"></i> Add';
                  } else {
                    template += '    <button id="unshift_' + info.id + '_btn" class="add-btn btn btn-default btn-xs form-btn" ng-click="unshift(\'' + info.name + '\',$event)">' +
                    '        <i class="glyphicon glyphicon-plus"></i> Add';
                  }
                  template += '    </button>';
                }

                template +=  '</div>' +
                  '<div ng-form class="' + (cssFrameworkService.framework() === 'bs2' ? 'row-fluid ' : '') +
                  convertFormStyleToClass(info.formStyle) + '" name="form_' + niceName + '{{$index}}" class="sub-doc well" id="' + info.id + 'List_{{$index}}" ' +
                  ' ng-repeat="subDoc in ' + (options.model || 'record') + '.' + info.name + ' track by $index">' +
                  '   <div class="' + (cssFrameworkService.framework() === 'bs2' ? 'row-fluid' : 'row') + ' sub-doc">';
                if (!info.noRemove || info.customSubDoc) {
                  template += '   <div class="sub-doc-btns">';
                  if (info.customSubDoc) {
                    template += info.customSubDoc;
                  }
                  if (!info.noRemove) {
                    if (cssFrameworkService.framework() === 'bs2') {
                      template += '      <button name="remove_' + info.id + '_btn" class="remove-btn btn btn-mini form-btn" ng-click="remove(\'' + info.name + '\',$index,$event)">' +
                      '          <i class="icon-minus">';

                    } else {
                      template += '      <button name="remove_' + info.id + '_btn" class="remove-btn btn btn-default btn-xs form-btn" ng-click="remove(\'' + info.name + '\',$index,$event)">' +
                      '          <i class="glyphicon glyphicon-minus">';
                    }
                    template += '          </i> Remove' +
                    '      </button>';
                  }
                  template += '  </div> ';
                }

                template += processInstructions(info.schema, false, {subschema: true, formstyle: info.formStyle, model: options.model, subschemaRoot: info.name});

                template += '   </div>' +
                  '</div>';
                if (!info.noAdd || info.customFooter) {
                  template += '<div class = "schema-foot">';
                  if (info.customFooter) {
                    template += info.customFooter;
                  }
                  if (!info.noAdd) {
                    if (cssFrameworkService.framework() === 'bs2') {
                    template += '    <button id="add_' + info.id + '_btn" class="add-btn btn btn-mini form-btn" ng-click="add(\'' + info.name + '\',$event)">' +
                    '        <i class="icon-plus"></i> Add';
                  } else {
                    template += '    <button id="add_' + info.id + '_btn" class="add-btn btn btn-default btn-xs form-btn" ng-click="add(\'' + info.name + '\',$event)">' +
                    '        <i class="glyphicon glyphicon-plus"></i> Add';
                  }
                  template += '    </button>';
                }
                  template += '</div>';
                }
              }
            }
          }
          else {
            // Handle arrays here
            var controlDivClasses = formMarkupHelper.controlDivClasses(options);
            if (info.array) {
              controlDivClasses.push('fng-array');
              if (options.formstyle === 'inline') { throw new Error('Cannot use arrays in an inline form'); }
              template += formMarkupHelper.label(scope, info, true, options);
              template += formMarkupHelper.handleArrayInputAndControlDiv(generateInput(info, 'arrayItem.x', true, info.id + '_{{$index}}', options), controlDivClasses, info, options);
            } else {
              // Single fields here
              template += formMarkupHelper.label(scope, info, null, options);
              template += formMarkupHelper.handleInputAndControlDiv(generateInput(info, null, options.required, info.id, options), controlDivClasses);
            }
          }
          template += fieldChrome.closeTag;
          return template;
        };

        var inferMissingProperties = function(info) {
          // infer missing values
          info.type = info.type || 'text';
          info.id = info.id || 'f_' + info.name.replace(/\./g, '_');
          info.label = (info.label !== undefined) ? (info.label === null ? '' : info.label) : $filter('titleCase')(info.name.split('.').slice(-1)[0]);
        };

//              var processInstructions = function (instructionsArray, topLevel, groupId) {
//  removing groupId as it was only used when called by containerType container, which is removed for now
        var processInstructions = function (instructionsArray, topLevel, options) {
          var result = '';
          if (instructionsArray) {
            for (var anInstruction = 0; anInstruction < instructionsArray.length; anInstruction++) {
              var info = instructionsArray[anInstruction];
              if (anInstruction === 0 && topLevel && !options.schema.match(/$_schema_/)) {
                info.add = info.add ? ' ' + info.add + ' ' : '';
                if (info.add.indexOf('ui-date') === -1 && !options.noautofocus && !info.containerType) {
                  info.add = info.add + 'autofocus ';
                }
              }

              var callHandleField = true;
              if (info.directive) {
                var directiveName = info.directive;
                var newElement = '<' + directiveName + ' model="' + (options.model || 'record') + '"';
                var thisElement = element[0];
                inferMissingProperties(info);
                for (var i = 0; i < thisElement.attributes.length; i++) {
                  var thisAttr = thisElement.attributes[i];
                  switch (thisAttr.nodeName) {
                    case 'class' :
                      var classes = thisAttr.value.replace('ng-scope', '');
                      if (classes.length > 0) {
                        newElement += ' class="' + classes + '"';
                      }
                      break;
                    case 'schema' :
                      var bespokeSchemaDefName = ('bespoke_' + info.name).replace(/\./g, '_');
                      scope[bespokeSchemaDefName] = angular.copy(info);
                      delete scope[bespokeSchemaDefName].directive;
                      newElement += ' schema="' + bespokeSchemaDefName + '"';
                      break;
                    default :
                      newElement += ' ' + thisAttr.nodeName + '="' + thisAttr.value + '"';
                  }
                }
                var directiveCamel = attrs.$normalize(info.directive);
                for (var prop in info) {
                  if (info.hasOwnProperty(prop)) {
                    switch (prop) {
                      case 'directive' : break;
                      case 'schema' : break;
                      case 'add' :
                        switch (typeof info.add) {
                          case 'string' :
                            newElement += ' ' + info.add;
                            break;
                          case 'object' :
                            for (var subAdd in info.add) {
                              newElement += ' ' + subAdd + '="' + info.add[subAdd].toString().replace(/"/g,'&quot;') +'"';
                            }
                            break;
                          default:
                            throw new Error('Invalid add property of type ' + typeof(info.add) + ' in directive ' + info.name);
                        }
                        break;
                      case directiveCamel :
                        for (var subProp in info[prop]) {
                          newElement += info.directive + '-' + subProp + '="' + info[prop][subProp]+'"';
                        }
                        break;
                      default: newElement += ' fng-fld-' + prop + '="' + info[prop].toString().replace(/"/g,'&quot;') + '"'; break;
                    }
                  }
                }
                for (prop in options) {
                  if (options.hasOwnProperty(prop) && prop[0] !== '$' && typeof options[prop] !== 'undefined') {
                    newElement += ' fng-opt-' + prop + '="' + options[prop].toString().replace(/"/g,'&quot;') + '"';
                  }
                }

                newElement += '></' + directiveName + '>';
                result += newElement;
                callHandleField = false;
              } else if (info.containerType) {
                var parts = containerInstructions(info);
                switch (info.containerType) {
                  case 'tab' :
                    // maintain support for simplified tabset syntax for now
                    if (!tabsSetup) {
                      tabsSetup = 'forced';
                      result += '<tabset>';
                    }

                    result += parts.before;
                    result += processInstructions(info.content, null, options);
                    result += parts.after;
                    break;
                  case 'tabset' :
                    tabsSetup = true;
                    result += parts.before;
                    result += processInstructions(info.content, null, options);
                    result += parts.after;
                    break;
                  default:
                    // includes wells, fieldset
                    result += parts.before;
                    result += processInstructions(info.content, null, options);
                    result += parts.after;
                    break;
                }
                callHandleField = false;
              } else if (options.subkey) {
                // Don't display fields that form part of the subkey, as they should not be edited (because in these circumstances they form some kind of key)
                var objectToSearch = angular.isArray(scope[options.subkey]) ? scope[options.subkey][0].keyList : scope[options.subkey].keyList;
                if (_.find(objectToSearch, function (value, key) {
                  return scope[options.subkey].path + '.' + key === info.name;
                })) {
                  callHandleField = false;
                }
              }
              if (callHandleField) {
                //                            if (groupId) {
                //                                scope['showHide' + groupId] = true;
                //                            }
                inferMissingProperties(info);
                result += handleField(info, options);
              }
            }
          } else {
            console.log('Empty array passed to processInstructions');
            result = '';
          }
          return result;

        };

        var unwatch = scope.$watch(attrs.schema, function (newValue) {
          if (newValue) {
            newValue = angular.isArray(newValue) ? newValue : [newValue];   // otherwise some old tests stop working for no real reason
            if (newValue.length > 0) {
              unwatch();
              var elementHtml = '';
              var theRecord = scope[attrs.model || 'record'];      // By default data comes from scope.record
              theRecord = theRecord || {};
              if ((attrs.subschema || attrs.model) && !attrs.forceform) {
                elementHtml = '';
              } else {
                scope.topLevelFormName = attrs.name || 'myForm';     // Form name defaults to myForm
                // Copy attrs we don't process into form
                var customAttrs = '';
                for (var thisAttr in attrs) {
                  if (attrs.hasOwnProperty(thisAttr)) {
                    if (thisAttr[0] !== '$' && ['name', 'formstyle', 'schema', 'subschema', 'model'].indexOf(thisAttr) === -1) {
                      customAttrs += ' ' + attrs.$attr[thisAttr] + '="' + attrs[thisAttr] + '"';
                    }
                  }
                }
                elementHtml = '<form name="' + scope.topLevelFormName + '" class="' + convertFormStyleToClass(attrs.formstyle) + ' novalidate"' + customAttrs + '>';
              }
              if (theRecord === scope.topLevelFormName) { throw new Error('Model and Name must be distinct - they are both ' + theRecord); }
              elementHtml += processInstructions(newValue, true, attrs);
              if (tabsSetup === 'forced') {
                elementHtml += '</tabset>';
              }
              elementHtml += attrs.subschema ? '' : '</form>';
              element.replaceWith($compile(elementHtml)(scope));
              // If there are subkeys we need to fix up ng-model references when record is read
              // If we have modelControllers we need to let them know when we have form + data
              if (subkeys.length > 0 || $data.modelControllers.length > 0) {
                var unwatch2 = scope.$watch('phase', function (newValue) {
                  if (newValue === 'ready') {
                    unwatch2();

                    // Tell the 'model controllers' that the form and data are there
                    for (var i = 0 ; i < $data.modelControllers.length ; i++) {
                      if ($data.modelControllers[i].onAllReady) {
                        $data.modelControllers[i].onAllReady(scope);
                      }
                    }

                    // For each one of the subkeys sets in the form
                    for (var subkeyCtr = 0; subkeyCtr < subkeys.length; subkeyCtr++) {
                      var info = subkeys[subkeyCtr];
                      var arrayOffset;
                      var matching;
                      var arrayToProcess = angular.isArray(info.subkey) ? info.subkey : [info.subkey];

                      var parts = info.name.split('.');
                      var dataVal = theRecord;
                      while (parts.length > 1) {
                        dataVal = dataVal[parts.shift()] || {};
                      }
                      dataVal = dataVal[parts[0]] = dataVal[parts[0]] || [];

                      // For each of the required subkeys of this type
                      for (var thisOffset = 0; thisOffset < arrayToProcess.length; thisOffset++) {

                        if (arrayToProcess[thisOffset].selectFunc) {
                          // Get the array offset from a function
                          if (!scope[arrayToProcess[thisOffset].selectFunc] || typeof scope[arrayToProcess[thisOffset].selectFunc] !== 'function') {
                            throw new Error('Subkey function ' + arrayToProcess[thisOffset].selectFunc + ' is not properly set up');
                          }
                          arrayOffset = scope[arrayToProcess[thisOffset].selectFunc](theRecord, info);

                        } else if (arrayToProcess[thisOffset].keyList) {
                          // We are chosing the array element by matching one or more keys
                          var thisSubkeyList = arrayToProcess[thisOffset].keyList;

                          for (arrayOffset = 0; arrayOffset < dataVal.length; arrayOffset++) {
                            matching = true;
                            for (var keyField in thisSubkeyList) {
                              if (thisSubkeyList.hasOwnProperty(keyField)) {
                                // Not (currently) concerned with objects here - just simple types and lookups
                                if (dataVal[arrayOffset][keyField] !== thisSubkeyList[keyField] &&
                                  (!dataVal[arrayOffset][keyField].text || dataVal[arrayOffset][keyField].text !== thisSubkeyList[keyField])) {
                                  matching = false;
                                  break;
                                }
                              }
                            }
                            if (matching) {
                              break;
                            }
                          }
                          if (!matching) {
                            // There is no matching array element - we need to create one
                            arrayOffset = theRecord[info.name].push(thisSubkeyList) - 1;
                          }
                        } else {
                          throw new Error('Invalid subkey setup for ' + info.name);
                        }
                        scope['$_arrayOffset_' + info.name.replace(/\./g, '_') + '_' + thisOffset] = arrayOffset;
                      }
                    }
                  }
                });
              }

              $rootScope.$broadcast('formInputDone');

              if (formGenerator.updateDataDependentDisplay && theRecord && Object.keys(theRecord).length > 0) {
                // If this is not a test force the data dependent updates to the DOM
                  formGenerator.updateDataDependentDisplay(theRecord, null, true, scope);
              }
            }
          }

        }, true);

      }
    };
  }])
;
