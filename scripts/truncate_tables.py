#!/usr/bin/env python3
"""Truncate all DynamoDB tables for this Amplify app."""
import boto3
import sys

SUFFIX = "3346n5xiuvfyrl6nxinfzmmh5a-NONE"

client = boto3.client("dynamodb")
tables = [t for t in client.list_tables()["TableNames"] if SUFFIX in t]

print("Found {} tables to truncate".format(len(tables)))

for table_name in tables:
    print("\n=== {} ===".format(table_name))

    # Get key schema
    desc = client.describe_table(TableName=table_name)
    key_attrs = [k["AttributeName"] for k in desc["Table"]["KeySchema"]]

    # Scan all items (only fetch keys)
    items = []
    params = {
        "TableName": table_name,
        "ProjectionExpression": ", ".join(key_attrs),
    }
    while True:
        resp = client.scan(**params)
        items.extend(resp.get("Items", []))
        if "LastEvaluatedKey" not in resp:
            break
        params["ExclusiveStartKey"] = resp["LastEvaluatedKey"]

    if not items:
        print("  Already empty")
        continue

    print("  Deleting {} items...".format(len(items)))

    # Batch delete (25 at a time)
    for i in range(0, len(items), 25):
        batch = items[i : i + 25]
        request_items = {
            table_name: [
                {"DeleteRequest": {"Key": {k: item[k] for k in key_attrs}}}
                for item in batch
            ]
        }
        client.batch_write_item(RequestItems=request_items)

    print("  Done")

print("\n=== All tables truncated ===")
