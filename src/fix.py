with open('/home/claude/sedori-tracker-v2/src/App.js', 'r') as f:
    content = f.read()

# 子レコードのinlineFormを修正 - 子のIDと一致する場合のみ表示
old = '''        <div key={child.id}>
          <ItemRow item={child} children={[]} isChild={true}
            expandedIds={expandedIds} toggleExpand={toggleExpand} updateStatus={updateStatus}
            setInlineEditId={setInlineEditId} inlineEditId={inlineEditId} deleteItem={deleteItem} />
          {inlineEditId === child.id && inlineForm}
        </div>'''

new = '''        <div key={child.id}>
          <ItemRow item={child} children={[]} isChild={true}
            expandedIds={expandedIds} toggleExpand={toggleExpand} updateStatus={updateStatus}
            setInlineEditId={setInlineEditId} inlineEditId={inlineEditId} deleteItem={deleteItem} />
          {inlineEditId === child.id && editFormElement}
        </div>'''

content = content.replace(old, new)

# 親のレンダリング部分を修正
old = '''              {(() => {
                const inlineForm = editItem ? (
                  <ItemForm
                    data={editItem}
                    setData={setEditItem}
                    onSubmit={updateItem}
                    onCancel={() => { setInlineEditId(null); setEditItem(null); }}
                    isEdit={true}
                    parentOptions={parentOptions}
                    compact={true}
                  />
                ) : null;
                return (
                  <>
                    <ItemRow
                      item={item}
                      children={childrenOf(item.id)}
                      isChild={false}
                      expandedIds={expandedIds}
                      toggleExpand={toggleExpand}
                      updateStatus={updateStatus}
                      setInlineEditId={handleInlineEdit}
                      inlineEditId={inlineEditId}
                      deleteItem={deleteItem}
                      inlineForm={inlineEditId === item.id ? inlineForm : null}
                    />
                    {inlineEditId === item.id && inlineForm}
                  </>
                );
              })()}'''

new = '''              <ItemRow
                item={item}
                children={childrenOf(item.id)}
                isChild={false}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                updateStatus={updateStatus}
                setInlineEditId={handleInlineEdit}
                inlineEditId={inlineEditId}
                deleteItem={deleteItem}
                editFormElement={editItem ? (
                  <ItemForm
                    data={editItem}
                    setData={setEditItem}
                    onSubmit={updateItem}
                    onCancel={() => { setInlineEditId(null); setEditItem(null); }}
                    isEdit={true}
                    parentOptions={parentOptions}
                    compact={true}
                  />
                ) : null}
              />
              {inlineEditId === item.id && editItem && (
                <ItemForm
                  data={editItem}
                  setData={setEditItem}
                  onSubmit={updateItem}
                  onCancel={() => { setInlineEditId(null); setEditItem(null); }}
                  isEdit={true}
                  parentOptions={parentOptions}
                  compact={true}
                />
              )}'''

content = content.replace(old, new)

# ItemRowのpropsにeditFormElementを追加
old = 'function ItemRow({ item, children, isChild, expandedIds, toggleExpand, updateStatus, setInlineEditId, inlineEditId, deleteItem, inlineForm }) {'
new = 'function ItemRow({ item, children, isChild, expandedIds, toggleExpand, updateStatus, setInlineEditId, inlineEditId, deleteItem, editFormElement }) {'

content = content.replace(old, new)

# 子レコードにeditFormElementを渡す
old = '''          <ItemRow item={child} children={[]} isChild={true}
            expandedIds={expandedIds} toggleExpand={toggleExpand} updateStatus={updateStatus}
            setInlineEditId={setInlineEditId} inlineEditId={inlineEditId} deleteItem={deleteItem} />
          {inlineEditId === child.id && editFormElement}'''

new = '''          <ItemRow item={child} children={[]} isChild={true}
            expandedIds={expandedIds} toggleExpand={toggleExpand} updateStatus={updateStatus}
            setInlineEditId={setInlineEditId} inlineEditId={inlineEditId} deleteItem={deleteItem}
            editFormElement={editFormElement} />
          {inlineEditId === child.id && editFormElement}'''

content = content.replace(old, new)

with open('/home/claude/sedori-tracker-v2/src/App.js', 'w') as f:
    f.write(content)

print("完了")
